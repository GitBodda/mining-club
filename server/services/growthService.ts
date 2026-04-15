/**
 * Growth Service
 * Handles the 6-pillar growth system:
 *   1. Free Starter Miner (automatic on signup)
 *   2. Organic sharing layer data
 *   3. Trust/transparency stats
 *   4. Qualified referral system
 *   5. Founding Miners Club
 *   6. Two-lane growth (normal + ambassador)
 */

import { db } from "../db";
import { eq, and, desc, sql, count, sum, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import { notificationService } from "./notificationService";
import { walletService } from "./walletService";

// ─── Config helpers ────────────────────────────────────────────────────────────

async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const rows = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, key));
    return rows[0]?.value ?? fallback;
  } catch {
    return fallback;
  }
}

async function getNumericSetting(key: string, fallback: number): Promise<number> {
  const val = parseFloat(await getSetting(key, String(fallback)));
  return Number.isFinite(val) ? val : fallback;
}

// ─── PUBLIC BASE URL ──────────────────────────────────────────────────────────
export function getPublicBaseUrl(): string {
  return process.env.PUBLIC_APP_URL ?? "https://blockmint.app";
}

export function makeReferralLink(code: string): string {
  return `${getPublicBaseUrl()}/r/${code}`;
}

// ─── 1. STARTER MINER ─────────────────────────────────────────────────────────

export const growthService = {

  /**
   * Grant the free starter miner to a brand-new user.
   * Idempotent – will silently return if the user already has one.
   */
  async grantStarterMiner(userId: string): Promise<schema.StarterReward | null> {
    try {
      // Idempotency check
      const existing = await db.select().from(schema.starterRewards)
        .where(eq(schema.starterRewards.userId, userId));
      if (existing.length > 0) return existing[0];

      // Load config from app_settings / env
      const hashrate       = await getNumericSetting("starter_hashrate_ths",     0.4);
      const durationDays   = await getNumericSetting("starter_duration_days",     365);
      const dailyReturnBtc = await getNumericSetting("starter_daily_return_btc",  0.0000008);

      const now     = new Date();
      const expires = new Date(now.getTime() + durationDays * 86_400_000);

      // Create a real mining_purchases record so the contract shows in the app
      const [purchase] = await db.insert(schema.miningPurchases).values({
        userId,
        packageName:   "Starter",
        crypto:        "BTC",
        amount:        0,         // free
        hashrate,
        hashrateUnit:  "TH/s",
        dailyReturnBTC: dailyReturnBtc,
        returnPercent: 0,
        status:        "active",
        expiryDate:    expires,
      }).returning();

      // Create starter_rewards record
      const [reward] = await db.insert(schema.starterRewards).values({
        userId,
        status:          "active",
        hashrate,
        hashrateUnit:    "TH/s",
        crypto:          "BTC",
        durationDays,
        dailyReturnBtc,
        qualifyingEvent: "signup",
        miningPurchaseId: purchase.id,
        activatedAt:     now,
        expiresAt:       expires,
      }).returning();

      // Grant starter_miner badge
      await this.grantBadge(userId, "starter_miner", "Starter Miner");

      // Notify user
      await notificationService.create({
        userId,
        type:     "reward",
        category: "user",
        title:    "Your Free Starter Miner is Active!",
        message:  `You've been awarded ${hashrate} TH/s of free cloud Bitcoin mining power for ${durationDays} days. Welcome to BlockMint!`,
        data:     { starterRewardId: reward.id, hashrate, durationDays },
        priority: "high",
      });

      // Check founder club eligibility
      await this.checkAndGrantFounderStatus(userId);

      // Fire signup reward rules
      try {
        const { rewardsService } = await import("./rewardsService");
        await rewardsService.checkAndTriggerRewards(userId, "signup", { userId });
      } catch {
        // Non-fatal
      }

      return reward;
    } catch (error) {
      console.error("growthService.grantStarterMiner error:", error);
      return null;
    }
  },

  /**
   * Get the starter reward for a user (if any).
   */
  async getStarterReward(userId: string): Promise<schema.StarterReward | null> {
    const rows = await db.select().from(schema.starterRewards)
      .where(eq(schema.starterRewards.userId, userId));
    return rows[0] ?? null;
  },

  // ─── 2. REFERRAL SYSTEM ───────────────────────────────────────────────────

  /**
   * Attribute a referral code to a new user at the moment of signup.
   * Prevents self-referral and duplicate attribution.
   */
  async attributeReferral(referredUserId: string, referralCode: string): Promise<boolean> {
    try {
      // Find referrer
      const referrers = await db.select().from(schema.users)
        .where(eq(schema.users.referralCode, referralCode));
      if (referrers.length === 0) return false;

      const referrer = referrers[0];

      // Prevent self-referral
      if (referrer.id === referredUserId) return false;

      // Check if already attributed (idempotent)
      const existing = await db.select().from(schema.referralEvents)
        .where(and(
          eq(schema.referralEvents.referredUserId, referredUserId),
          eq(schema.referralEvents.eventType, "attributed"),
        ));
      if (existing.length > 0) return false;

      // Store referredBy on user
      await db.update(schema.users)
        .set({ referredBy: referrer.id })
        .where(eq(schema.users.id, referredUserId));

      // Log attribution event
      await db.insert(schema.referralEvents).values({
        referrerId:      referrer.id,
        referredUserId,
        referralCode,
        eventType:       "attributed",
        eventData:       { source: "signup" },
      });

      // Log signup event
      await db.insert(schema.referralEvents).values({
        referrerId:      referrer.id,
        referredUserId,
        referralCode,
        eventType:       "signup",
        eventData:       { signedUpAt: new Date().toISOString() },
      });

      return true;
    } catch (error) {
      console.error("attributeReferral error:", error);
      return false;
    }
  },

  /**
   * Called when a referred user makes a qualifying action.
   * Issues referral reward to referrer (idempotent via idempotencyKey).
   */
  async qualifyReferral(referredUserId: string, triggerData: { amount?: number; currency?: string; purchaseId?: string }): Promise<boolean> {
    try {
      // Find the attribution event
      const attrs = await db.select().from(schema.referralEvents)
        .where(and(
          eq(schema.referralEvents.referredUserId, referredUserId),
          eq(schema.referralEvents.eventType, "attributed"),
        ));
      if (attrs.length === 0) return false;

      const attr = attrs[0];

      // Check min spend
      const minUsd = await getNumericSetting("referral_qualify_min_usd", 50);
      if (triggerData.amount !== undefined && triggerData.amount < minUsd) return false;

      // Idempotency key – one reward per referrer+referred pair
      const idempKey = `${attr.referrerId}:${referredUserId}:reward`;

      // Check if already rewarded
      const alreadyRewarded = await db.select().from(schema.referralEvents)
        .where(eq(schema.referralEvents.idempotencyKey, idempKey));
      if (alreadyRewarded.length > 0) return false;

      const rewardUsd = await getNumericSetting("referral_reward_usd", 10);

      // Mark qualified
      await db.insert(schema.referralEvents).values({
        referrerId:      attr.referrerId,
        referredUserId,
        referralCode:    attr.referralCode,
        eventType:       "qualified",
        eventData:       { ...triggerData, qualifiedAt: new Date().toISOString() },
        qualifiedAt:     new Date(),
      });

      // Issue reward to referrer
      const credited = await walletService.credit(
        attr.referrerId,
        "USDT",
        rewardUsd,
        `Referral reward for inviting user`,
      );

      if (!credited) return false;

      // Log reward_issued event (idempotent via idempotencyKey)
      await db.insert(schema.referralEvents).values({
        referrerId:      attr.referrerId,
        referredUserId,
        referralCode:    attr.referralCode,
        eventType:       "reward_issued",
        rewardIssued:    true,
        rewardAmount:    rewardUsd,
        rewardCurrency:  "USDT",
        idempotencyKey:  idempKey,
        qualifiedAt:     new Date(),
        eventData:       { ...triggerData },
      });

      // Grant first_referral badge to referrer
      await this.grantBadge(attr.referrerId, "first_referral", "First Referral");

      // Notify referrer
      await notificationService.create({
        userId:   attr.referrerId,
        type:     "reward",
        category: "user",
        title:    "🎉 Referral Reward Earned!",
        message:  `You earned $${rewardUsd} USDT — your referral just made their first qualifying purchase!`,
        data:     { rewardAmount: rewardUsd, currency: "USDT", referredUserId },
        priority: "high",
      });

      // Notify referred user
      await notificationService.create({
        userId:   referredUserId,
        type:     "reward",
        category: "user",
        title:    "✅ Referral Verified",
        message:  "Your signup through a referral link was verified. Your referrer just received their reward!",
        data:     {},
        priority: "normal",
      });

      return true;
    } catch (error) {
      console.error("qualifyReferral error:", error);
      return false;
    }
  },

  /**
   * Get referral stats for a user.
   */
  async getReferralStats(userId: string) {
    const totalReferrals = await db.select({ c: count() }).from(schema.referralEvents)
      .where(and(
        eq(schema.referralEvents.referrerId, userId),
        eq(schema.referralEvents.eventType, "signup"),
      ));

    const qualifiedReferrals = await db.select({ c: count() }).from(schema.referralEvents)
      .where(and(
        eq(schema.referralEvents.referrerId, userId),
        eq(schema.referralEvents.eventType, "qualified"),
      ));

    const rewardRows = await db.select({ total: sum(schema.referralEvents.rewardAmount) })
      .from(schema.referralEvents)
      .where(and(
        eq(schema.referralEvents.referrerId, userId),
        eq(schema.referralEvents.eventType, "reward_issued"),
      ));

    const rewardHistory = await db.select().from(schema.referralEvents)
      .where(and(
        eq(schema.referralEvents.referrerId, userId),
        eq(schema.referralEvents.eventType, "reward_issued"),
      ))
      .orderBy(desc(schema.referralEvents.createdAt))
      .limit(20);

    const user = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    const referralCode = user[0]?.referralCode ?? "";

    return {
      referralCode,
      referralLink:      makeReferralLink(referralCode),
      totalReferrals:    Number(totalReferrals[0]?.c ?? 0),
      qualifiedReferrals: Number(qualifiedReferrals[0]?.c ?? 0),
      totalEarnings:     Number(rewardRows[0]?.total ?? 0),
      rewardHistory,
    };
  },

  // ─── 3. FOUNDER CLUB ──────────────────────────────────────────────────────

  /**
   * Check if user qualifies for founding membership and grant it.
   * Idempotent.
   */
  async checkAndGrantFounderStatus(userId: string): Promise<schema.FounderMember | null> {
    try {
      // Already a founder?
      const existing = await db.select().from(schema.founderMembers)
        .where(eq(schema.founderMembers.userId, userId));
      if (existing.length > 0) return existing[0];

      // Check cap
      const cap = await getNumericSetting("founder_cap", 1000);
      const [countRow] = await db.select({ c: count() }).from(schema.founderMembers);
      const currentCount = Number(countRow?.c ?? 0);
      if (currentCount >= cap) return null;

      // Get next sequence
      const sequence = currentCount + 1;

      // Insert founder record
      const [member] = await db.insert(schema.founderMembers).values({
        userId,
        sequence,
        tier:     sequence <= 200 ? "founding" : sequence <= 600 ? "early" : "community",
        benefits: {
          badge:          true,
          founderSequence: sequence,
          tier:           sequence <= 200 ? "founding" : sequence <= 600 ? "early" : "community",
        },
      }).returning();

      // Update user flags
      await db.update(schema.users)
        .set({ isFounder: true, founderSequence: sequence })
        .where(eq(schema.users.id, userId));

      // Grant founder badge
      await this.grantBadge(userId, "founder", `Founding Miner #${sequence}`);

      // Notify
      await notificationService.create({
        userId,
        type:     "reward",
        category: "user",
        title:    `⛏️ Welcome, Founding Miner #${sequence}!`,
        message:  `You've secured your spot in the Founding Miners Club (${member.tier} tier). This badge is permanent and exclusive.`,
        data:     { sequence, tier: member.tier },
        priority: "high",
      });

      return member;
    } catch (error) {
      console.error("checkAndGrantFounderStatus error:", error);
      return null;
    }
  },

  /**
   * Get founder club stats (public progress surface).
   */
  async getFounderStats() {
    const cap      = await getNumericSetting("founder_cap", 1000);
    const [countRow] = await db.select({ c: count() }).from(schema.founderMembers);
    const claimed  = Number(countRow?.c ?? 0);
    const remaining = Math.max(0, cap - claimed);
    const pct      = cap > 0 ? Math.round((claimed / cap) * 100) : 0;

    return { cap, claimed, remaining, pct };
  },

  /**
   * Get a user's founder member record.
   */
  async getFounderMember(userId: string): Promise<schema.FounderMember | null> {
    const rows = await db.select().from(schema.founderMembers)
      .where(eq(schema.founderMembers.userId, userId));
    return rows[0] ?? null;
  },

  // ─── 4. BADGES ────────────────────────────────────────────────────────────

  async grantBadge(userId: string, slug: string, name: string, level = 1, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await db.insert(schema.growthBadges).values({
        userId,
        badgeSlug:  slug,
        badgeName:  name,
        badgeLevel: level,
        metadata:   metadata ?? null,
      }).onConflictDoNothing(); // unique (userId, badgeSlug) — handled by app-level logic
    } catch {
      // Non-fatal
    }
  },

  async getUserBadges(userId: string): Promise<schema.GrowthBadge[]> {
    return db.select().from(schema.growthBadges)
      .where(eq(schema.growthBadges.userId, userId))
      .orderBy(desc(schema.growthBadges.earnedAt));
  },

  // ─── 5. AMBASSADOR SYSTEM ─────────────────────────────────────────────────

  async applyForAmbassador(userId: string): Promise<{ success: boolean; error?: string }> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!user) return { success: false, error: "User not found" };
    if (user.isAmbassador) return { success: false, error: "Already an ambassador" };
    if (user.ambassadorStatus === "pending") return { success: false, error: "Application already pending" };

    await db.update(schema.users)
      .set({ ambassadorStatus: "pending", ambassadorAppliedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await notificationService.create({
      userId,
      type:     "system",
      category: "user",
      title:    "Ambassador Application Received",
      message:  "Your application to become a BlockMint Ambassador is under review. We'll notify you within 48 hours.",
      data:     {},
      priority: "normal",
    });

    return { success: true };
  },

  async approveAmbassador(userId: string, adminId: string): Promise<boolean> {
    await db.update(schema.users)
      .set({ isAmbassador: true, ambassadorStatus: "active", ambassadorApprovedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await this.grantBadge(userId, "ambassador", "BlockMint Ambassador");

    await notificationService.create({
      userId,
      type:     "reward",
      category: "user",
      title:    "You're Now a BlockMint Ambassador!",
      message:  "Your ambassador application was approved. You now have access to ambassador perks and extended referral tracking.",
      data:     { ambassadorId: userId },
      priority: "high",
    });

    // Log admin action
    await db.insert(schema.adminActions).values({
      adminId,
      targetUserId: userId,
      actionType:   "approve_ambassador",
      details:      { approvedAt: new Date().toISOString() },
    });

    return true;
  },

  // ─── 6. GROWTH DASHBOARD DATA ─────────────────────────────────────────────

  /**
   * Returns all growth data for a user in one call.
   */
  async getGrowthProfile(userId: string) {
    const [starterReward, referralStats, founderMember, badges, user] = await Promise.all([
      this.getStarterReward(userId),
      this.getReferralStats(userId),
      this.getFounderMember(userId),
      this.getUserBadges(userId),
      db.select().from(schema.users).where(eq(schema.users.id, userId)).then(r => r[0]),
    ]);

    const founderStats = await this.getFounderStats();

    // Compute days elapsed for starter miner progress
    let starterProgress = 0;
    if (starterReward?.activatedAt && starterReward?.expiresAt) {
      const total = starterReward.expiresAt.getTime() - starterReward.activatedAt.getTime();
      const elapsed = Date.now() - starterReward.activatedAt.getTime();
      starterProgress = Math.min(100, Math.round((elapsed / total) * 100));
    }

    return {
      user: { id: userId, displayName: user?.displayName, email: user?.email, isFounder: user?.isFounder, isAmbassador: user?.isAmbassador, ambassadorStatus: user?.ambassadorStatus },
      starterReward: starterReward ? { ...starterReward, progress: starterProgress } : null,
      referral: referralStats,
      founder: founderMember,
      founderStats,
      badges,
    };
  },

  // ─── 7. PLATFORM STATS (for transparency page) ────────────────────────────

  async getPlatformStats() {
    try {
      const [userCount] = await db.select({ c: count() }).from(schema.users).where(eq(schema.users.isActive, true));
      const [founderCount] = await db.select({ c: count() }).from(schema.founderMembers);
      const [activeMiners] = await db.select({ c: count() }).from(schema.miningPurchases).where(eq(schema.miningPurchases.status, "active"));
      const [totalHashrate] = await db.select({ total: sum(schema.miningPurchases.hashrate) }).from(schema.miningPurchases).where(eq(schema.miningPurchases.status, "active"));
      const founderStats = await this.getFounderStats();

      return {
        activeUsers:     Number(userCount?.c ?? 0),
        founderMembers:  Number(founderCount?.c ?? 0),
        activeMiners:    Number(activeMiners?.c ?? 0),
        totalHashrateThs: Number(totalHashrate?.total ?? 0),
        founderCap:      founderStats.cap,
        founderRemaining: founderStats.remaining,
        founderPct:      founderStats.pct,
        uptime:          "99.97%",
        supportedCoins:  ["BTC", "LTC"],
        poolFeePercent:  2.0,
        referralRewardUsd: await getNumericSetting("referral_reward_usd", 10),
        referralQualifyMinUsd: await getNumericSetting("referral_qualify_min_usd", 50),
      };
    } catch {
      return {
        activeUsers: 0, founderMembers: 0, activeMiners: 0, totalHashrateThs: 0,
        founderCap: 1000, founderRemaining: 1000, founderPct: 0,
        uptime: "99.97%", supportedCoins: ["BTC", "LTC"], poolFeePercent: 2.0,
        referralRewardUsd: 10, referralQualifyMinUsd: 50,
      };
    }
  },

  // ─── 8. SHARE CARD DATA ───────────────────────────────────────────────────

  async getShareCardData(userId: string) {
    const profile = await this.getGrowthProfile(userId);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    const referralLink = makeReferralLink(user?.referralCode ?? "");

    return {
      displayName:    user?.displayName ?? "Miner",
      referralLink,
      referralCode:   user?.referralCode ?? "",
      isFounder:      !!user?.isFounder,
      founderSequence: user?.founderSequence,
      isAmbassador:   !!user?.isAmbassador,
      starterActive:  !!profile.starterReward && profile.starterReward.status === "active",
      totalReferrals: profile.referral.totalReferrals,
      totalEarnings:  profile.referral.totalEarnings,
      badges:         profile.badges.map(b => b.badgeSlug),
      hashrate:       profile.starterReward?.hashrate ?? 0,
      hashrateUnit:   profile.starterReward?.hashrateUnit ?? "TH/s",
      shareBaseUrl:   getPublicBaseUrl(),
    };
  },
};

export default growthService;
