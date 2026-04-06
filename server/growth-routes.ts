/**
 * Growth Routes
 * All API endpoints for the 6-pillar growth system.
 * Mounted at /api/growth/* by server/index.ts
 */

import type { Express } from "express";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { growthService, makeReferralLink, getPublicBaseUrl } from "./services/growthService";
import { authService } from "./services/authService";

// ─── Auth middleware ───────────────────────────────────────────────────────────

async function resolveAuthUser(req: any): Promise<schema.User | null> {
  const authHeader = req.headers["authorization"] as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = await authService.verifyToken(token);
    if (!payload?.uid) return null;
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.firebaseUid, payload.uid));
    return users[0] ?? null;
  } catch {
    return null;
  }
}

function requireAuth(handler: (req: any, res: any, user: schema.User) => Promise<void>) {
  return async (req: any, res: any) => {
    const user = await resolveAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    // Block inactive users
    if (!user.isActive) return res.status(403).json({ error: "Account suspended" });
    return handler(req, res, user);
  };
}

function requireAdmin(handler: (req: any, res: any, user: schema.User) => Promise<void>) {
  return async (req: any, res: any) => {
    const user = await resolveAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role !== "admin" && user.role !== "super_admin") return res.status(403).json({ error: "Admin access required" });
    return handler(req, res, user);
  };
}

// ─── Helper – resolve userId param (supports Firebase UID or DB UUID) ─────────
async function resolveUserId(idOrUid: string): Promise<string | null> {
  const [byId] = await db.select({ id: schema.users.id }).from(schema.users)
    .where(eq(schema.users.id, idOrUid));
  if (byId) return byId.id;
  const [byUid] = await db.select({ id: schema.users.id }).from(schema.users)
    .where(eq(schema.users.firebaseUid, idOrUid));
  return byUid?.id ?? null;
}

export function registerGrowthRoutes(app: Express) {

  // ── Referral landing page meta (resolves code → referrer info for landing page) ──
  // PUBLIC – no auth needed
  app.get("/api/growth/referral-info/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const users = await db.select({
        displayName: schema.users.displayName,
        referralCode: schema.users.referralCode,
        isFounder: schema.users.isFounder,
        founderSequence: schema.users.founderSequence,
      }).from(schema.users)
        .where(eq(schema.users.referralCode, code));

      if (users.length === 0) return res.status(404).json({ error: "Invalid referral code" });
      const u = users[0];
      return res.json({
        code,
        displayName: u.displayName ?? "A BlockMint Miner",
        isFounder:   !!u.isFounder,
        founderSequence: u.founderSequence,
        signupUrl:   `${getPublicBaseUrl()}/r/${code}`,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch referral info" });
    }
  });

  // ── Lightweight endpoint to get a user's own referral code (no auth needed) ──
  app.get("/api/growth/referral-code/:userId", async (req, res) => {
    try {
      const dbId = await resolveUserId(req.params.userId);
      if (!dbId) return res.status(404).json({ error: "User not found" });
      const [user] = await db.select({ referralCode: schema.users.referralCode })
        .from(schema.users).where(eq(schema.users.id, dbId));
      if (!user?.referralCode) return res.status(404).json({ error: "No referral code" });
      return res.json({ referralCode: user.referralCode });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch referral code" });
    }
  });

  // ── Store referral attribution (called just before/during signup) ──────────
  // Called server-side during auth/sync; also available as standalone endpoint
  app.post("/api/growth/attribute-referral", async (req, res) => {
    try {
      const { referredUserId, referralCode } = req.body;
      if (!referredUserId || !referralCode) return res.status(400).json({ error: "Missing parameters" });

      const dbId = await resolveUserId(referredUserId);
      if (!dbId) return res.status(404).json({ error: "User not found" });

      const result = await growthService.attributeReferral(dbId, referralCode);
      return res.json({ attributed: result });
    } catch (err) {
      res.status(500).json({ error: "Attribution failed" });
    }
  });

  // ── Full growth profile ────────────────────────────────────────────────────
  app.get("/api/growth/profile/:userId", requireAuth(async (req, res, authedUser) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });

      // Users can only see their own profile unless admin
      if (targetId !== authedUser.id && authedUser.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const profile = await growthService.getGrowthProfile(targetId);
      return res.json(profile);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch growth profile" });
    }
  }));

  // ── Starter reward status ──────────────────────────────────────────────────
  app.get("/api/growth/starter-reward/:userId", requireAuth(async (req, res, authedUser) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      if (targetId !== authedUser.id && authedUser.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const reward = await growthService.getStarterReward(targetId);
      return res.json({ reward });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch starter reward" });
    }
  }));

  // ── Referral stats ─────────────────────────────────────────────────────────
  app.get("/api/growth/referral-stats/:userId", requireAuth(async (req, res, authedUser) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      if (targetId !== authedUser.id && authedUser.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const stats = await growthService.getReferralStats(targetId);
      return res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  }));

  // ── Share card data ────────────────────────────────────────────────────────
  app.get("/api/growth/share-card/:userId", requireAuth(async (req, res, authedUser) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      if (targetId !== authedUser.id && authedUser.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const data = await growthService.getShareCardData(targetId);
      return res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch share card data" });
    }
  }));

  // ── Founder stats (PUBLIC) ────────────────────────────────────────────────
  app.get("/api/growth/founder-stats", async (_req, res) => {
    try {
      const stats = await growthService.getFounderStats();
      return res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch founder stats" });
    }
  });

  // ── Platform stats (PUBLIC, for transparency page) ─────────────────────────
  app.get("/api/growth/platform-stats", async (_req, res) => {
    try {
      const stats = await growthService.getPlatformStats();
      return res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch platform stats" });
    }
  });

  // ── User badges ────────────────────────────────────────────────────────────
  app.get("/api/growth/badges/:userId", requireAuth(async (req, res, authedUser) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      if (targetId !== authedUser.id && authedUser.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const badges = await growthService.getUserBadges(targetId);
      return res.json({ badges });
    } catch {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  }));

  // ── Ambassador application ─────────────────────────────────────────────────
  app.post("/api/growth/ambassador/apply", requireAuth(async (req, res, authedUser) => {
    try {
      const result = await growthService.applyForAmbassador(authedUser.id);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.json({ success: true, message: "Application submitted. We'll review within 48 hours." });
    } catch (err) {
      res.status(500).json({ error: "Application failed" });
    }
  }));

  // ── Admin: approve ambassador ──────────────────────────────────────────────
  app.post("/api/growth/admin/ambassador/approve/:userId", requireAdmin(async (req, res, admin) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      const ok = await growthService.approveAmbassador(targetId, admin.id);
      return res.json({ success: ok });
    } catch (err) {
      res.status(500).json({ error: "Approval failed" });
    }
  }));

  // ── Admin: list ambassador applications ───────────────────────────────────
  app.get("/api/growth/admin/ambassadors", requireAdmin(async (_req, res, _admin) => {
    try {
      const pending = await db.select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        ambassadorStatus: schema.users.ambassadorStatus,
        ambassadorAppliedAt: schema.users.ambassadorAppliedAt,
        isAmbassador: schema.users.isAmbassador,
      }).from(schema.users)
        .where(eq(schema.users.ambassadorStatus, "pending"))
        .orderBy(desc(schema.users.ambassadorAppliedAt));
      return res.json({ pending });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch ambassadors" });
    }
  }));

  // ── Admin: grant/revoke founder status ────────────────────────────────────
  app.post("/api/growth/admin/founder/grant/:userId", requireAdmin(async (req, res, admin) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      const member = await growthService.checkAndGrantFounderStatus(targetId);
      return res.json({ success: !!member, member });
    } catch (err) {
      res.status(500).json({ error: "Failed to grant founder status" });
    }
  }));

  // ── Admin: list all founder members ───────────────────────────────────────
  app.get("/api/growth/admin/founders", requireAdmin(async (_req, res, _admin) => {
    try {
      const members = await db.select({
        id: schema.founderMembers.id,
        userId: schema.founderMembers.userId,
        sequence: schema.founderMembers.sequence,
        tier: schema.founderMembers.tier,
        badgeGrantedAt: schema.founderMembers.badgeGrantedAt,
        isActive: schema.founderMembers.isActive,
        displayName: schema.users.displayName,
        email: schema.users.email,
      }).from(schema.founderMembers)
        .innerJoin(schema.users, eq(schema.founderMembers.userId, schema.users.id))
        .orderBy(schema.founderMembers.sequence);
      return res.json({ members });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch founders" });
    }
  }));

  // ── Admin: referral event audit log ───────────────────────────────────────
  app.get("/api/growth/admin/referral-events", requireAdmin(async (req, res, _admin) => {
    try {
      const limit  = Math.min(Number(req.query.limit ?? 50), 200);
      const offset = Number(req.query.offset ?? 0);
      const events = await db.select().from(schema.referralEvents)
        .orderBy(desc(schema.referralEvents.createdAt))
        .limit(limit).offset(offset);
      return res.json({ events });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  }));

  // ── Qualify a referral (called after purchase) ────────────────────────────
  // This is called internally from routes.ts after a successful purchase.
  // Also exposed as an admin override endpoint.
  app.post("/api/growth/qualify-referral/:userId", requireAdmin(async (req, res, _admin) => {
    try {
      const targetId = await resolveUserId(req.params.userId);
      if (!targetId) return res.status(404).json({ error: "User not found" });
      const result = await growthService.qualifyReferral(targetId, req.body ?? {});
      return res.json({ qualified: result });
    } catch (err) {
      res.status(500).json({ error: "Qualification failed" });
    }
  }));

  // ── Apple universal links / well-known association (hardisk.co) ───────────
  // Serve the apple-app-site-association file for hardisk.co universal links
  app.get("/.well-known/apple-app-site-association", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: "TEAMID.co.hardisk.app", // Replace TEAMID with actual Apple Team ID
            paths: ["/r/*", "/invite/*", "/signup*", "/founders*"],
          }
        ]
      }
    });
  });

  // ── OG/meta for referral landing page (used by social crawlers) ───────────
  app.get("/r/:code", async (req, res) => {
    const { code } = req.params;
    // Try to find user
    const users = await db.select({ displayName: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.referralCode, code));
    const name = users[0]?.displayName ?? "A BlockMint Miner";
    const url  = getPublicBaseUrl();

    // Return HTML with rich OG meta + redirect to the app
    res.setHeader("Content-Type", "text/html");
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${name} invited you to BlockMint — Free Bitcoin Mining</title>
  <meta property="og:title"       content="${name} invited you to BlockMint"/>
  <meta property="og:description" content="Join BlockMint and start mining Bitcoin today. Your first 0.5 TH/s is free for 365 days."/>
  <meta property="og:url"         content="${url}/r/${code}"/>
  <meta property="og:image"       content="${url}/og-referral.png"/>
  <meta property="og:type"        content="website"/>
  <meta name="twitter:card"       content="summary_large_image"/>
  <meta name="twitter:title"      content="${name} invited you to BlockMint"/>
  <meta name="twitter:description" content="Start mining Bitcoin for free. No hardware needed."/>
  <meta name="twitter:image"      content="${url}/og-referral.png"/>
  <meta name="apple-itunes-app"   content="app-id=APPSTOREID, app-argument=${url}/r/${code}"/>
  <link rel="canonical"           href="${url}/r/${code}"/>
  <script>
    // Store referral code for attribution on signup
    try { localStorage.setItem('ref', '${code}'); } catch(e){}
    // Redirect to app after short delay
    setTimeout(() => { window.location.replace('${url}?ref=${code}'); }, 300);
  </script>
  <style>
    body{margin:0;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;text-align:center;padding:24px}
    .logo{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#f7931a,#ff6b35);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    h1{font-size:1.5rem;margin:0}p{color:#aaa;margin:0}
    .cta{display:inline-block;margin-top:16px;padding:14px 32px;background:linear-gradient(135deg,#f7931a,#ff6b35);border-radius:12px;color:#fff;text-decoration:none;font-weight:600;font-size:1rem}
  </style>
</head>
<body>
  <div class="logo">BlockMint</div>
  <h1>${name} invited you to start mining Bitcoin for free</h1>
  <p>Join BlockMint and get 0.5 TH/s free cloud mining for 365 days. No hardware. No upfront cost.</p>
  <a class="cta" href="${url}?ref=${code}">Accept Invite &amp; Start Mining</a>
</body>
</html>`);
  });
}
