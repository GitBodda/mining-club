// Admin API routes for full control of the app
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { verifyIdToken, setCustomClaims } from "./firebase-admin";
import { HDWalletService } from "./services/hdWalletService";
import * as stripeService from "./services/stripeService";

// Admin API key for dashboard authentication (matches client-side admin password)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "MiningClub2024!";

// Middleware to verify admin authentication
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Option 1: Check X-Admin-Key header (used by admin dashboard)
    const adminKey = req.headers["x-admin-key"] as string;
    if (adminKey && adminKey === ADMIN_API_KEY) {
      (req as any).user = { admin: true, source: "api-key" };
      return next();
    }

    // Option 2: Check Firebase Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(idToken);
    
    // SECURITY: Only allow specific admin emails
    const ADMIN_EMAILS = ["abdohassan777@gmail.com", "info@hardisk.co"];
    if (!ADMIN_EMAILS.includes(decodedToken.email || "")) {
      console.warn(`Unauthorized admin access attempt by: ${decodedToken.email}`);
      return res.status(403).json({ error: "Admin access restricted" });
    }

    // Check if user is admin
    if (!decodedToken.admin && decodedToken.role !== "admin") {
      // For development: allow first user or check database
      const users = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, decodedToken.uid));
      if (users.length === 0 || users[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
    }

    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Development-only middleware (bypasses auth for testing)
function devAdmin(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "development") {
    return next();
  }
  return requireAdmin(req, res, next);
}

export async function registerAdminRoutes(app: Express) {
  
  // ============ COMPLIANCE & USER MODE ============
  
  // Check if user should see safe mode (for App Store reviewers)
  // TestFlight testers (whitelisted emails) see normal app
  app.post("/api/compliance/check-mode", async (req, res) => {
    try {
      const { email, buildNumber } = req.body;
      
      // Get compliance mode setting
      const [complianceConfig] = await db.select()
        .from(schema.appConfig)
        .where(eq(schema.appConfig.key, "compliance_mode"))
        .limit(1);
      
      const complianceEnabled = complianceConfig?.value?.toLowerCase() === "true";
      
      if (!complianceEnabled) {
        // Compliance off = everyone sees normal app
        return res.json({ showSafeMode: false, reason: "compliance_disabled" });
      }
      
      // If compliance is ON, check if user is a whitelisted tester
      if (email) {
        const [user] = await db.select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);
        
        // If user exists in database = they're a tester/existing user
        // Show them the NORMAL app (not safe mode)
        if (user) {
          return res.json({ showSafeMode: false, reason: "existing_user" });
        }
      }
      
      // Build number check: TestFlight users have specific build numbers
      // You can whitelist build numbers here if needed
      if (buildNumber && parseInt(buildNumber) >= 20) {
        return res.json({ showSafeMode: false, reason: "testflight_build" });
      }
      
      // Default: Show safe mode (for App Store reviewers)
      return res.json({ showSafeMode: true, reason: "reviewer_mode" });
    } catch (error) {
      console.error("Error checking compliance mode:", error);
      // On error, default to safe mode for safety
      res.json({ showSafeMode: true, reason: "error" });
    }
  });
  
  // ============ USER MANAGEMENT ============
  
  // Get all users
  app.get("/api/admin/users", devAdmin, async (_req, res) => {
    try {
      const users = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get single user
  app.get("/api/admin/users/:id", devAdmin, async (req, res) => {
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id));
      if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(users[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user
  app.patch("/api/admin/users/:id", devAdmin, async (req, res) => {
    try {
      const { isActive, role, displayName } = req.body;
      const updateData: any = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (role) updateData.role = role;
      if (displayName) updateData.displayName = displayName;

      const users = await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, req.params.id))
        .returning();
      
      // Update Firebase custom claims if role changed
      if (role && users[0].firebaseUid) {
        await setCustomClaims(users[0].firebaseUid, { role, admin: role === "admin" });
      }

      res.json(users[0]);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Toggle user active status (Block/Unblock)
  app.post("/api/admin/users/:userId/toggle-status", devAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      const [user] = await db.update(schema.users)
        .set({ isActive })
        .where(eq(schema.users.id, userId))
        .returning();
      
      res.json(user);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });

  // Admin disable 2FA for user
  app.post("/api/admin/users/:userId/disable-2fa", devAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ error: "2FA is not enabled for this user" });
      }

      // Disable 2FA and clear secret
      await db.update(schema.users)
        .set({ 
          twoFactorEnabled: false,
          twoFactorSecret: null
        })
        .where(eq(schema.users.id, userId));

      // Create notification for user
      await db.insert(schema.notifications).values({
        userId,
        type: "security",
        category: "user",
        title: "🔐 Two-Factor Authentication Disabled",
        message: "Your two-factor authentication has been disabled by support at your request. You can re-enable it anytime from Settings > Security.",
        priority: "high",
        data: { action: "2fa_disabled_by_admin" },
      });

      console.log(`Admin disabled 2FA for user: ${user.email}`);
      res.json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  // ============ WALLET MANAGEMENT ============
  
  // Get all user wallets
  app.get("/api/admin/wallets", devAdmin, async (_req, res) => {
    try {
      const wallets = await db.select().from(schema.wallets);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  // Get wallets for a specific user
  app.get("/api/admin/users/:userId/wallets", devAdmin, async (req, res) => {
    try {
      const wallets = await db.select().from(schema.wallets)
        .where(eq(schema.wallets.userId, req.params.userId));
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user wallets" });
    }
  });

  // Update wallet balance
  app.patch("/api/admin/wallets/:id", devAdmin, async (req, res) => {
    try {
      const { balance } = req.body;
      const wallets = await db.update(schema.wallets)
        .set({ balance })
        .where(eq(schema.wallets.id, req.params.id))
        .returning();
      res.json(wallets[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update wallet" });
    }
  });

  // Generate new HD wallet mnemonic
  app.post("/api/admin/wallet/generate-mnemonic", devAdmin, async (req, res) => {
    try {
      const { strength } = req.body;
      const wordCount = strength === 128 ? 128 : 256; // 12 or 24 words
      const mnemonic = HDWalletService.generateMnemonic(wordCount as 128 | 256);
      
      res.json({ 
        mnemonic,
        wordCount: wordCount === 128 ? 12 : 24,
        warning: "Store this mnemonic in a secure location. It cannot be recovered if lost."
      });
    } catch (error) {
      console.error("Error generating mnemonic:", error);
      res.status(500).json({ error: "Failed to generate mnemonic" });
    }
  });

  // Validate mnemonic phrase
  app.post("/api/admin/wallet/validate-mnemonic", devAdmin, async (req, res) => {
    try {
      const { mnemonic } = req.body;
      if (!mnemonic) {
        return res.status(400).json({ error: "Mnemonic is required" });
      }

      const isValid = HDWalletService.validateMnemonic(mnemonic);
      
      if (isValid) {
        // Generate sample addresses to show what would be generated
        const hdWallet = new HDWalletService(mnemonic);
        const sampleAddresses = hdWallet.generateAllAddresses(0);
        
        res.json({ 
          valid: true,
          sampleAddresses: {
            bitcoin: sampleAddresses.bitcoin.address,
            litecoin: sampleAddresses.litecoin.address,
            ethereum: sampleAddresses.ethereum.address,
            zcash: sampleAddresses.zcash.address,
          }
        });
      } else {
        res.json({ valid: false, error: "Invalid mnemonic phrase" });
      }
    } catch (error) {
      console.error("Error validating mnemonic:", error);
      res.status(500).json({ error: "Failed to validate mnemonic" });
    }
  });

  // ============ MAIN WALLET (App Treasury) ============
  
  // Get main wallets
  app.get("/api/admin/main-wallet", devAdmin, async (_req, res) => {
    try {
      const wallets = await db.select().from(schema.masterWallet);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch main wallet" });
    }
  });

  // Update main wallet
  app.patch("/api/admin/main-wallet/:symbol", devAdmin, async (req, res) => {
    try {
      const { balance, address } = req.body;
      const network = req.body?.network || "mainnet";
      const updateData: any = { updatedAt: new Date() };
      if (balance !== undefined) updateData.balance = balance;
      if (address) updateData.address = address;

      const wallets = await db.update(schema.masterWallet)
        .set(updateData)
        .where(eq(schema.masterWallet.symbol, req.params.symbol))
        .returning();
      
      if (wallets.length === 0) {
        // Create if doesn't exist
        const newWallet = await db.insert(schema.masterWallet)
          .values({ network, symbol: req.params.symbol, balance: balance || 0, address: address || "" })
          .returning();
        return res.json(newWallet[0]);
      }
      res.json(wallets[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update main wallet" });
    }
  });

  // Withdraw from main wallet
  app.post("/api/admin/main-wallet/:symbol/withdraw", devAdmin, async (req, res) => {
    try {
      const { amount, toAddress, note } = req.body;
      const network = req.body?.network || "mainnet";
      
      // Get current balance
      const wallets = await db.select().from(schema.masterWallet)
        .where(eq(schema.masterWallet.symbol, req.params.symbol));
      
      if (wallets.length === 0 || wallets[0].balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Update balance
      await db.update(schema.masterWallet)
        .set({ balance: wallets[0].balance - amount, updatedAt: new Date() })
        .where(eq(schema.masterWallet.symbol, req.params.symbol));

      // Record transaction
      await db.insert(schema.transactions).values({
        // NOTE: this must be a valid users.id due to FK constraints.
        // If you need full treasury withdraw logging, create a real system user and use its id.
        userId: wallets[0].id,
        type: "withdrawal",
        amount,
        currency: req.params.symbol,
        status: "completed",
        toAddress,
        note: note || "Admin withdrawal",
        completedAt: new Date(),
      });

      res.json({ success: true, newBalance: wallets[0].balance - amount });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // ============ INVESTMENT PLANS ============
  
  // Get all plans
  app.get("/api/admin/plans", devAdmin, async (_req, res) => {
    try {
      const plans = await db.select().from(schema.investmentPlans).orderBy(schema.investmentPlans.order);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // Create plan
  app.post("/api/admin/plans", devAdmin, async (req, res) => {
    try {
      const plan = await db.insert(schema.investmentPlans).values(req.body).returning();
      res.json(plan[0]);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    }
  });

  // Update plan
  app.patch("/api/admin/plans/:id", devAdmin, async (req, res) => {
    try {
      const plan = await db.update(schema.investmentPlans)
        .set(req.body)
        .where(eq(schema.investmentPlans.id, req.params.id))
        .returning();
      res.json(plan[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  // Delete plan
  app.delete("/api/admin/plans/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.investmentPlans).where(eq(schema.investmentPlans.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });

  // ============ MINER PRICING ============
  
  // Get all miners
  app.get("/api/admin/miners", devAdmin, async (_req, res) => {
    try {
      const miners = await db.select().from(schema.minerPricing).orderBy(schema.minerPricing.order);
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miners" });
    }
  });

  // Create miner
  app.post("/api/admin/miners", devAdmin, async (req, res) => {
    try {
      const miner = await db.insert(schema.minerPricing).values(req.body).returning();
      res.json(miner[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create miner" });
    }
  });

  // Update miner
  app.patch("/api/admin/miners/:id", devAdmin, async (req, res) => {
    try {
      const miner = await db.update(schema.minerPricing)
        .set(req.body)
        .where(eq(schema.minerPricing.id, req.params.id))
        .returning();
      res.json(miner[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update miner" });
    }
  });

  // Delete miner
  app.delete("/api/admin/miners/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.minerPricing).where(eq(schema.minerPricing.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete miner" });
    }
  });

  // ============ APP CONTENT ============
  
  // Get all content
  app.get("/api/admin/content", devAdmin, async (_req, res) => {
    try {
      const content = await db.select().from(schema.appContent).orderBy(schema.appContent.order);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Create content
  app.post("/api/admin/content", devAdmin, async (req, res) => {
    try {
      const content = await db.insert(schema.appContent).values(req.body).returning();
      res.json(content[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  // Update content
  app.patch("/api/admin/content/:id", devAdmin, async (req, res) => {
    try {
      const content = await db.update(schema.appContent)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.appContent.id, req.params.id))
        .returning();
      res.json(content[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // Delete content
  app.delete("/api/admin/content/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.appContent).where(eq(schema.appContent.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // ============ DISCOUNTS ============
  
  // Get all discounts
  app.get("/api/admin/discounts", devAdmin, async (_req, res) => {
    try {
      const discounts = await db.select().from(schema.discounts);
      res.json(discounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discounts" });
    }
  });

  // Create discount
  app.post("/api/admin/discounts", devAdmin, async (req, res) => {
    try {
      const discount = await db.insert(schema.discounts).values(req.body).returning();
      res.json(discount[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create discount" });
    }
  });

  // Update discount
  app.patch("/api/admin/discounts/:id", devAdmin, async (req, res) => {
    try {
      const discount = await db.update(schema.discounts)
        .set(req.body)
        .where(eq(schema.discounts.id, req.params.id))
        .returning();
      res.json(discount[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update discount" });
    }
  });

  // Delete discount
  app.delete("/api/admin/discounts/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.discounts).where(eq(schema.discounts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete discount" });
    }
  });

  // ============ APP SETTINGS ============
  
  // Get all settings
  app.get("/api/admin/settings", devAdmin, async (_req, res) => {
    try {
      const settings = await db.select().from(schema.appSettings);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Upsert setting
  app.put("/api/admin/settings/:key", devAdmin, async (req, res) => {
    try {
      const { value, type, description } = req.body;
      
      // Try to update first
      const updated = await db.update(schema.appSettings)
        .set({ value, type, description, updatedAt: new Date() })
        .where(eq(schema.appSettings.key, req.params.key))
        .returning();
      
      if (updated.length === 0) {
        // Insert new
        const created = await db.insert(schema.appSettings)
          .values({ key: req.params.key, value, type: type || "string", description })
          .returning();
        return res.json(created[0]);
      }
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // ============ INVESTMENTS ============
  
  // Get all investments
  app.get("/api/admin/investments", devAdmin, async (_req, res) => {
    try {
      const investments = await db.select().from(schema.investments).orderBy(desc(schema.investments.startDate));
      res.json(investments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investments" });
    }
  });

  // Update investment
  app.patch("/api/admin/investments/:id", devAdmin, async (req, res) => {
    try {
      const investment = await db.update(schema.investments)
        .set(req.body)
        .where(eq(schema.investments.id, req.params.id))
        .returning();
      res.json(investment[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update investment" });
    }
  });

  // ============ EARNINGS ============
  
  // Add earnings to user
  app.post("/api/admin/earnings", devAdmin, async (req, res) => {
    try {
      const { userId, investmentId, amount, currency, type } = req.body;
      
      const earning = await db.insert(schema.earnings).values({
        userId,
        investmentId,
        amount,
        currency,
        type: type || "manual",
      }).returning();

      // Update user wallet balance
      const wallets = await db.select().from(schema.wallets)
        .where(eq(schema.wallets.userId, userId));
      
      const wallet = wallets.find(w => w.symbol === currency);
      if (wallet) {
        await db.update(schema.wallets)
          .set({ balance: wallet.balance + amount })
          .where(eq(schema.wallets.id, wallet.id));
      }

      res.json(earning[0]);
    } catch (error) {
      console.error("Error adding earnings:", error);
      res.status(500).json({ error: "Failed to add earnings" });
    }
  });

  // Process daily earnings for all active investments
  app.post("/api/admin/process-daily-earnings", devAdmin, async (_req, res) => {
    try {
      // Get daily return percentage from settings
      const settings = await db.select().from(schema.appSettings)
        .where(eq(schema.appSettings.key, "daily_return_percent"));
      const dailyPercent = settings.length > 0 ? parseFloat(settings[0].value) : 1;

      // Get all active investments
      const investments = await db.select().from(schema.investments)
        .where(eq(schema.investments.status, "active"));

      let processed = 0;
      for (const investment of investments) {
        const earningAmount = investment.amount * (dailyPercent / 100);
        
        // Record earning
        await db.insert(schema.earnings).values({
          userId: investment.userId,
          investmentId: investment.id,
          amount: earningAmount,
          currency: investment.currency,
          type: "daily",
        });

        // Update investment total earned
        await db.update(schema.investments)
          .set({ totalEarned: investment.totalEarned + earningAmount })
          .where(eq(schema.investments.id, investment.id));

        // Update user wallet
        const wallets = await db.select().from(schema.wallets)
          .where(eq(schema.wallets.userId, investment.userId));
        
        const wallet = wallets.find(w => w.symbol === investment.currency);
        if (wallet) {
          await db.update(schema.wallets)
            .set({ balance: wallet.balance + earningAmount })
            .where(eq(schema.wallets.id, wallet.id));
        }

        processed++;
      }

      res.json({ success: true, processedCount: processed, dailyPercent });
    } catch (error) {
      console.error("Error processing daily earnings:", error);
      res.status(500).json({ error: "Failed to process daily earnings" });
    }
  });

  // ============ TRANSACTIONS ============
  
  // Get all transactions
  app.get("/api/admin/transactions", devAdmin, async (_req, res) => {
    try {
      const transactions = await db.select().from(schema.transactions).orderBy(desc(schema.transactions.createdAt));
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Update transaction status
  app.patch("/api/admin/transactions/:id", devAdmin, async (req, res) => {
    try {
      const { status, txHash, note } = req.body;
      const updateData: any = {};
      if (status) {
        updateData.status = status;
        if (status === "completed") {
          updateData.completedAt = new Date();
        }
      }
      if (txHash) updateData.txHash = txHash;
      if (note) updateData.note = note;

      const transaction = await db.update(schema.transactions)
        .set(updateData)
        .where(eq(schema.transactions.id, req.params.id))
        .returning();
      res.json(transaction[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // ============ DASHBOARD STATS ============
  
  app.get("/api/admin/dashboard", devAdmin, async (_req, res) => {
    try {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
      const [investmentCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.investments);
      const [totalInvested] = await db.select({ sum: sql<number>`coalesce(sum(amount), 0)` }).from(schema.investments);
      const mainWallets = await db.select().from(schema.masterWallet);
      
      res.json({
        totalUsers: userCount.count,
        totalInvestments: investmentCount.count,
        totalInvestedAmount: totalInvested.sum,
        mainWallets,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ============ WITHDRAWALS ============

  // Get all pending withdrawals
  app.get("/api/admin/withdrawals", devAdmin, async (_req, res) => {
    try {
      const withdrawals = await db.select()
        .from(schema.transactions)
        .where(eq(schema.transactions.type, "withdrawal"))
        .orderBy(desc(schema.transactions.createdAt));
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // Approve withdrawal
  app.post("/api/admin/withdrawals/:id/approve", devAdmin, async (req, res) => {
    try {
      const { txHash } = req.body;
      const updated = await db.update(schema.transactions)
        .set({ 
          status: "completed", 
          txHash: txHash || null,
          completedAt: new Date()
        })
        .where(eq(schema.transactions.id, req.params.id))
        .returning();
      
      if (updated.length > 0) {
        // Create notification for user
        await db.insert(schema.notifications).values({
          userId: updated[0].userId,
          type: "withdrawal",
          title: "Withdrawal Approved",
          message: `Your withdrawal of ${updated[0].amount} ${updated[0].currency} has been approved.`,
          priority: "medium",
        });
      }
      
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
  });

  // Reject withdrawal
  app.post("/api/admin/withdrawals/:id/reject", devAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      
      // Get the transaction first
      const [transaction] = await db.select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, req.params.id));
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Update transaction status
      const updated = await db.update(schema.transactions)
        .set({ 
          status: "rejected", 
          note: reason || "Rejected by admin"
        })
        .where(eq(schema.transactions.id, req.params.id))
        .returning();
      
      // Refund to user wallet
      const [wallet] = await db.select()
        .from(schema.wallets)
        .where(eq(schema.wallets.userId, transaction.userId));
      
      if (wallet) {
        await db.update(schema.wallets)
          .set({ balance: wallet.balance + transaction.amount })
          .where(eq(schema.wallets.id, wallet.id));
      }

      // Create notification for user
      await db.insert(schema.notifications).values({
        userId: transaction.userId,
        type: "withdrawal",
        title: "Withdrawal Rejected",
        message: `Your withdrawal of ${transaction.amount} ${transaction.currency} was rejected. ${reason || ""}`,
        priority: "high",
      });
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  });

  // ============ AUTO-WITHDRAWALS ============

  // Get all auto-withdrawal configurations
  app.get("/api/admin/auto-withdrawals", devAdmin, async (_req, res) => {
    try {
      const configs = await db.select({
        id: schema.autoWithdrawSettings.id,
        userId: schema.autoWithdrawSettings.userId,
        enabled: schema.autoWithdrawSettings.enabled,
        currency: schema.autoWithdrawSettings.currency,
        network: schema.autoWithdrawSettings.network,
        walletAddress: schema.autoWithdrawSettings.walletAddress,
        period: schema.autoWithdrawSettings.period,
        minAmount: schema.autoWithdrawSettings.minAmount,
        lastWithdrawAt: schema.autoWithdrawSettings.lastWithdrawAt,
        createdAt: schema.autoWithdrawSettings.createdAt,
        updatedAt: schema.autoWithdrawSettings.updatedAt,
        userEmail: schema.users.email,
        userDisplayName: schema.users.displayName,
      })
        .from(schema.autoWithdrawSettings)
        .leftJoin(schema.users, eq(schema.autoWithdrawSettings.userId, schema.users.id))
        .orderBy(desc(schema.autoWithdrawSettings.updatedAt));
      res.json(configs);
    } catch (error) {
      console.error("Error fetching auto-withdrawals:", error);
      res.status(500).json({ error: "Failed to fetch auto-withdrawal configurations" });
    }
  });

  // Toggle auto-withdrawal for a user
  app.patch("/api/admin/auto-withdrawals/:id/toggle", devAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      const updated = await db.update(schema.autoWithdrawSettings)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(schema.autoWithdrawSettings.id, req.params.id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      console.error("Error toggling auto-withdrawal:", error);
      res.status(500).json({ error: "Failed to toggle auto-withdrawal" });
    }
  });

  // Delete auto-withdrawal config
  app.delete("/api/admin/auto-withdrawals/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.autoWithdrawSettings)
        .where(eq(schema.autoWithdrawSettings.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting auto-withdrawal:", error);
      res.status(500).json({ error: "Failed to delete auto-withdrawal configuration" });
    }
  });

  // ============ ADMIN NOTIFICATIONS ============

  // Get admin notifications
  app.get("/api/admin/notifications", devAdmin, async (_req, res) => {
    try {
      const notifications = await db.select()
        .from(schema.notifications)
        .where(eq(schema.notifications.userId, "admin"))
        .orderBy(desc(schema.notifications.createdAt));
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Send broadcast notification to all users
  app.post("/api/admin/notifications/broadcast", devAdmin, async (req, res) => {
    try {
      const { title, message, type } = req.body;
      
      // Get all active users
      const users = await db.select().from(schema.users).where(eq(schema.users.isActive, true));
      
      // Create notification for each user
      let sent = 0;
      for (const user of users) {
        await db.insert(schema.notifications).values({
          userId: user.id,
          type: type || "promotion",
          title,
          message,
          priority: "low",
        });
        sent++;
      }
      
      res.json({ success: true, notificationsSent: sent });
    } catch (error) {
      console.error("Broadcast error:", error);
      res.status(500).json({ error: "Failed to send broadcast" });
    }
  });

  // Send notification to specific user
  app.post("/api/admin/notifications/send", devAdmin, async (req, res) => {
    try {
      const { userId, title, message, type } = req.body;
      
      const notification = await db.insert(schema.notifications).values({
        userId,
        type: type || "system",
        title,
        message,
        priority: "medium",
      }).returning();
      
      res.json(notification[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // ============ SUPPORT TICKETS ============

  // Get all support tickets
  app.get("/api/admin/tickets", devAdmin, async (_req, res) => {
    try {
      const tickets = await db.select()
        .from(schema.supportTickets)
        .orderBy(desc(schema.supportTickets.createdAt));
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Close ticket
  app.post("/api/admin/tickets/:id/close", devAdmin, async (req, res) => {
    try {
      const updated = await db.update(schema.supportTickets)
        .set({ 
          status: "closed", 
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.supportTickets.id, req.params.id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to close ticket" });
    }
  });

  // ============ API CONFIGURATIONS ============

  // Get all API configs
  app.get("/api/admin/api-configs", devAdmin, async (_req, res) => {
    try {
      const configs = await db.select().from(schema.apiConfigs);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API configs" });
    }
  });

  // Update API config
  app.put("/api/admin/api-configs/:serviceName", devAdmin, async (req, res) => {
    try {
      const {
        apiKey,
        apiSecret,
        endpoint,
        isEnabled,
        displayName,
        description,
        category,
        order,
        isRequired,
        additionalConfig,
        config,
        webhookUrl,
      } = req.body;

      // Back-compat: some clients send `{ config: { value } }`.
      const normalizedAdditionalConfig =
        additionalConfig ??
        (config && typeof config === "object" ? config : undefined);
      
      // Try update first
      // Merge additional config if a webhookUrl is provided.
      const existing = await db
        .select({ additionalConfig: schema.apiConfigs.additionalConfig })
        .from(schema.apiConfigs)
        .where(eq(schema.apiConfigs.serviceName, req.params.serviceName))
        .limit(1);

      const mergedAdditionalConfig = (() => {
        const base = (existing[0]?.additionalConfig as any) || {};
        const next = (normalizedAdditionalConfig as any) || {};
        const merged = { ...base, ...next };
        if (typeof webhookUrl === "string" && webhookUrl.length > 0) merged.webhookUrl = webhookUrl;
        return Object.keys(merged).length > 0 ? merged : undefined;
      })();

      const updated = await db.update(schema.apiConfigs)
        .set({
          apiKey,
          apiSecret,
          endpoint,
          isEnabled,
          displayName,
          description,
          category,
          order,
          isRequired,
          additionalConfig: mergedAdditionalConfig,
          updatedAt: new Date(),
        })
        .where(eq(schema.apiConfigs.serviceName, req.params.serviceName))
        .returning();
      
      if (updated.length === 0) {
        // Create new config
        const created = await db.insert(schema.apiConfigs).values({
          serviceName: req.params.serviceName,
          displayName: displayName || req.params.serviceName,
          description,
          apiKey,
          apiSecret,
          endpoint,
          isEnabled: isEnabled !== false,
          isRequired,
          category,
          order,
          additionalConfig: (() => {
            const next = (normalizedAdditionalConfig as any) || {};
            if (typeof webhookUrl === "string" && webhookUrl.length > 0) next.webhookUrl = webhookUrl;
            return Object.keys(next).length > 0 ? next : undefined;
          })(),
        }).returning();
        return res.json(created[0]);
      }
      
      res.json(updated[0]);
    } catch (error) {
      console.error("API config error:", error);
      res.status(500).json({ error: "Failed to update API config" });
    }
  });

  // ============ FEATURE TOGGLES ============

  // Get all feature toggles
  app.get("/api/admin/feature-toggles", devAdmin, async (_req, res) => {
    try {
      const toggles = await db.select().from(schema.featureToggles);
      res.json(toggles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feature toggles" });
    }
  });

  // Toggle feature
  app.patch("/api/admin/feature-toggles/:featureName", devAdmin, async (req, res) => {
    try {
      const { isEnabled } = req.body;
      const updated = await db.update(schema.featureToggles)
        .set({ isEnabled, updatedAt: new Date() })
        .where(eq(schema.featureToggles.featureName, req.params.featureName))
        .returning();
      
      if (updated.length === 0) {
        // Create if not exists
        const created = await db.insert(schema.featureToggles).values({
          featureName: req.params.featureName,
          displayName: req.params.featureName,
          isEnabled,
          description: "",
        }).returning();
        return res.json(created[0]);
      }
      
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle feature" });
    }
  });

  // ============ ADMIN EMAILS ============

  // Get all admin emails
  app.get("/api/admin/admin-emails", devAdmin, async (_req, res) => {
    try {
      const emails = await db.select().from(schema.adminEmails);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin emails" });
    }
  });

  // Add admin email
  app.post("/api/admin/admin-emails", devAdmin, async (req, res) => {
    try {
      const { email, role } = req.body;
      const created = await db.insert(schema.adminEmails).values({
        email,
        role: role || "admin",
        addedBy: (req as any).user?.uid || "system",
      }).returning();
      res.json(created[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add admin email" });
    }
  });

  // Remove admin email
  app.delete("/api/admin/admin-emails/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.adminEmails).where(eq(schema.adminEmails.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove admin email" });
    }
  });

  // ============ EARN/YIELD PLANS MANAGEMENT ============

  // Get all earn plans
  app.get("/api/admin/earn-plans", devAdmin, async (_req, res) => {
    try {
      const plans = await db.select().from(schema.earnPlans).orderBy(schema.earnPlans.order);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earn plans" });
    }
  });

  // Create earn plan
  app.post("/api/admin/earn-plans", devAdmin, async (req, res) => {
    try {
      const { symbol, name, icon, colorPrimary, colorSecondary, minAmount, maxAmount, 
              dailyApr, weeklyApr, monthlyApr, quarterlyApr, yearlyApr, isActive, order } = req.body;
      
      const created = await db.insert(schema.earnPlans).values({
        symbol,
        name,
        icon,
        colorPrimary,
        colorSecondary,
        minAmount: minAmount || 50,
        maxAmount,
        dailyApr: dailyApr || 17.9,
        weeklyApr: weeklyApr || 18.0,
        monthlyApr: monthlyApr || 18.25,
        quarterlyApr: quarterlyApr || 18.7,
        yearlyApr: yearlyApr || 19.25,
        isActive: isActive ?? true,
        order: order || 0,
      }).returning();
      res.json(created[0]);
    } catch (error) {
      console.error("Error creating earn plan:", error);
      res.status(500).json({ error: "Failed to create earn plan" });
    }
  });

  // Update earn plan
  app.patch("/api/admin/earn-plans/:id", devAdmin, async (req, res) => {
    try {
      const updated = await db.update(schema.earnPlans)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.earnPlans.id, req.params.id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update earn plan" });
    }
  });

  // Delete earn plan
  app.delete("/api/admin/earn-plans/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.earnPlans).where(eq(schema.earnPlans.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete earn plan" });
    }
  });

  // ============ EARN FAQs MANAGEMENT ============

  // Get all earn FAQs
  app.get("/api/admin/earn-faqs", devAdmin, async (_req, res) => {
    try {
      const faqs = await db.select().from(schema.earnFaqs).orderBy(schema.earnFaqs.order);
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earn FAQs" });
    }
  });

  // Create earn FAQ
  app.post("/api/admin/earn-faqs", devAdmin, async (req, res) => {
    try {
      const { question, answer, isActive, order } = req.body;
      const created = await db.insert(schema.earnFaqs).values({
        question,
        answer,
        isActive: isActive ?? true,
        order: order || 0,
      }).returning();
      res.json(created[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create earn FAQ" });
    }
  });

  // Update earn FAQ
  app.patch("/api/admin/earn-faqs/:id", devAdmin, async (req, res) => {
    try {
      const updated = await db.update(schema.earnFaqs)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.earnFaqs.id, req.params.id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update earn FAQ" });
    }
  });

  // Delete earn FAQ
  app.delete("/api/admin/earn-faqs/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.earnFaqs).where(eq(schema.earnFaqs.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete earn FAQ" });
    }
  });

  // ============ EARN PAGE SETTINGS ============

  // Get earn page settings
  app.get("/api/admin/earn-settings", devAdmin, async (_req, res) => {
    try {
      const settings = await db.select().from(schema.earnPageSettings);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earn settings" });
    }
  });

  // Upsert earn page setting
  app.put("/api/admin/earn-settings/:key", devAdmin, async (req, res) => {
    try {
      const { value, type, description } = req.body;
      
      const updated = await db.update(schema.earnPageSettings)
        .set({ value, type, description, updatedAt: new Date() })
        .where(eq(schema.earnPageSettings.key, req.params.key))
        .returning();
      
      if (updated.length === 0) {
        const created = await db.insert(schema.earnPageSettings).values({
          key: req.params.key,
          value,
          type: type || "string",
          description,
        }).returning();
        return res.json(created[0]);
      }
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update earn setting" });
    }
  });

  // ============ EARN SUBSCRIPTIONS (User investments in earn plans) ============

  // Get all earn subscriptions
  app.get("/api/admin/earn-subscriptions", devAdmin, async (_req, res) => {
    try {
      const subscriptions = await db.select().from(schema.earnSubscriptions)
        .orderBy(desc(schema.earnSubscriptions.startDate));
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earn subscriptions" });
    }
  });

  // Update earn subscription status
  app.patch("/api/admin/earn-subscriptions/:id", devAdmin, async (req, res) => {
    try {
      const updated = await db.update(schema.earnSubscriptions)
        .set(req.body)
        .where(eq(schema.earnSubscriptions.id, req.params.id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update earn subscription" });
    }
  });

  // Process earn earnings for all active subscriptions
  app.post("/api/admin/process-earn-earnings", devAdmin, async (_req, res) => {
    try {
      const subscriptions = await db.select().from(schema.earnSubscriptions)
        .where(eq(schema.earnSubscriptions.status, "active"));

      let processed = 0;
      for (const sub of subscriptions) {
        // Calculate daily earning based on APR
        const dailyRate = sub.aprRate / 365 / 100;
        const earningAmount = sub.amount * dailyRate;
        
        // Update subscription total earned
        await db.update(schema.earnSubscriptions)
          .set({ 
            totalEarned: sub.totalEarned + earningAmount,
            lastEarningAt: new Date(),
          })
          .where(eq(schema.earnSubscriptions.id, sub.id));

        // Update user wallet
        const wallets = await db.select().from(schema.wallets)
          .where(eq(schema.wallets.userId, sub.userId));
        
        const wallet = wallets.find(w => w.symbol === sub.symbol);
        if (wallet) {
          await db.update(schema.wallets)
            .set({ balance: wallet.balance + earningAmount })
            .where(eq(schema.wallets.id, wallet.id));
        }

        processed++;
      }

      res.json({ success: true, processedCount: processed });
    } catch (error) {
      console.error("Error processing earn earnings:", error);
      res.status(500).json({ error: "Failed to process earn earnings" });
    }
  });

  // ============ PROMOTIONAL OFFERS ============
  
  // Get all offers
  app.get("/api/admin/offers", devAdmin, async (_req, res) => {
    try {
      const offers = await db.select().from(schema.promotionalOffers).orderBy(schema.promotionalOffers.order);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // Create offer
  app.post("/api/admin/offers", devAdmin, async (req, res) => {
    try {
      const [offer] = await db.insert(schema.promotionalOffers).values(req.body).returning();
      res.json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  // Update offer
  app.patch("/api/admin/offers/:id", devAdmin, async (req, res) => {
    try {
      const [offer] = await db.update(schema.promotionalOffers)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.promotionalOffers.id, req.params.id))
        .returning();
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  // Delete offer
  app.delete("/api/admin/offers/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.promotionalOffers).where(eq(schema.promotionalOffers.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete offer" });
    }
  });

  // ============ ADMIN SEED (add specific admin email) ============
  
  // Seed admin email - one-time setup endpoint
  app.post("/api/admin/seed-admin", async (req, res) => {
    try {
      const targetEmail = "abdohassan777@gmail.com";
      
      // Insert or update admin email
      await db.insert(schema.adminEmails).values({
        email: targetEmail,
        role: "admin",
        isActive: true,
      }).onConflictDoUpdate({
        target: schema.adminEmails.email,
        set: { role: "admin", isActive: true },
      });

      // Also update the user if exists
      const users = await db.select().from(schema.users).where(eq(schema.users.email, targetEmail));
      if (users.length > 0) {
        await db.update(schema.users)
          .set({ role: "admin" })
          .where(eq(schema.users.email, targetEmail));
        
        // Update Firebase claims if user has firebaseUid
        if (users[0].firebaseUid) {
          await setCustomClaims(users[0].firebaseUid, { admin: true, role: "admin" });
        }
      }

      res.json({ success: true, message: "Admin email seeded successfully" });
    } catch (error) {
      console.error("Error seeding admin:", error);
      res.status(500).json({ error: "Failed to seed admin" });
    }
  });

  // ============ ARTICLE MANAGEMENT ============
  
  // Get all articles
  app.get("/api/articles", async (req: Request, res: Response) => {
    try {
      const articles = await db.select().from(schema.articles).orderBy(schema.articles.order);
      res.json({ articles });
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Get single article by ID
  app.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const articles = await db
        .select()
        .from(schema.articles)
        .where(eq(schema.articles.id, req.params.id));
      
      if (articles.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json(articles[0]); // Return article directly, not wrapped
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Create article (admin only)
  app.post("/api/admin/articles", devAdmin, async (req: Request, res: Response) => {
    try {
      const { title, description, category, icon, image, order, isActive } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      const article = await db
        .insert(schema.articles)
        .values({
          title,
          description,
          category: category || "Basics",
          icon: icon || null,
          image: image || null,
          order: order ?? 0,
          isActive: isActive ?? true,
          updatedAt: new Date(),
        })
        .returning();

      res.json({ success: true, article: article[0] });
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  // Update article (admin only)
  app.put("/api/admin/articles/:id", devAdmin, async (req: Request, res: Response) => {
    try {
      const { title, description, category, icon, image, order, isActive } = req.body;

      const article = await db
        .update(schema.articles)
        .set({
          title: title ?? undefined,
          description: description ?? undefined,
          category: category ?? undefined,
          icon: icon ?? undefined,
          image: image ?? undefined,
          order: order ?? undefined,
          isActive: isActive ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(schema.articles.id, req.params.id))
        .returning();

      if (article.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json({ success: true, article: article[0] });
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  // Delete article (admin only)
  app.delete("/api/admin/articles/:id", devAdmin, async (req: Request, res: Response) => {
    try {
      const article = await db
        .delete(schema.articles)
        .where(eq(schema.articles.id, req.params.id))
        .returning();

      if (article.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json({ success: true, message: "Article deleted" });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  console.log("Admin routes registered");

  // ============ STRIPE SETTINGS (Admin) ============

  // Get Stripe settings
  app.get("/api/admin/stripe/settings", devAdmin, async (_req: Request, res: Response) => {
    try {
      const settings = await stripeService.getStripeSettings();
      res.json(settings || { isEnabled: false, mode: "test" });
    } catch (error) {
      console.error("Error fetching Stripe settings:", error);
      res.status(500).json({ error: "Failed to fetch Stripe settings" });
    }
  });

  // Update Stripe settings
  app.put("/api/admin/stripe/settings", devAdmin, async (req: Request, res: Response) => {
    try {
      const {
        isEnabled,
        mode,
        testPublishableKey,
        testSecretKey,
        testWebhookSecret,
        livePublishableKey,
        liveSecretKey,
        liveWebhookSecret,
        currency,
        allowedPaymentMethods,
        minPaymentAmount,
        maxPaymentAmount,
        webhookUrl,
      } = req.body;

      const existing = await db.select().from(schema.stripeSettings).limit(1);

      if (existing.length > 0) {
        const updated = await db
          .update(schema.stripeSettings)
          .set({
            isEnabled: isEnabled ?? existing[0].isEnabled,
            mode: mode ?? existing[0].mode,
            testPublishableKey: testPublishableKey ?? existing[0].testPublishableKey,
            testSecretKey: testSecretKey ?? existing[0].testSecretKey,
            testWebhookSecret: testWebhookSecret ?? existing[0].testWebhookSecret,
            livePublishableKey: livePublishableKey ?? existing[0].livePublishableKey,
            liveSecretKey: liveSecretKey ?? existing[0].liveSecretKey,
            liveWebhookSecret: liveWebhookSecret ?? existing[0].liveWebhookSecret,
            currency: currency ?? existing[0].currency,
            allowedPaymentMethods: allowedPaymentMethods ?? existing[0].allowedPaymentMethods,
            minPaymentAmount: minPaymentAmount ?? existing[0].minPaymentAmount,
            maxPaymentAmount: maxPaymentAmount ?? existing[0].maxPaymentAmount,
            webhookUrl: webhookUrl ?? existing[0].webhookUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.stripeSettings.id, existing[0].id))
          .returning();

        stripeService.invalidateStripeCache();
        return res.json(updated[0]);
      }

      // Create new settings
      const created = await db
        .insert(schema.stripeSettings)
        .values({
          isEnabled: isEnabled ?? false,
          mode: mode ?? "test",
          testPublishableKey,
          testSecretKey,
          testWebhookSecret,
          livePublishableKey,
          liveSecretKey,
          liveWebhookSecret,
          currency: currency ?? "usd",
          allowedPaymentMethods: allowedPaymentMethods ?? ["card"],
          minPaymentAmount: minPaymentAmount ?? 5,
          maxPaymentAmount: maxPaymentAmount ?? 10000,
          webhookUrl,
        })
        .returning();

      stripeService.invalidateStripeCache();
      res.json(created[0]);
    } catch (error: any) {
      console.error("Error updating Stripe settings:", error?.message || error);
      res.status(500).json({ error: "Failed to update Stripe settings", details: error?.message || String(error) });
    }
  });

  // Toggle Stripe on/off
  app.patch("/api/admin/stripe/toggle", devAdmin, async (req: Request, res: Response) => {
    try {
      const { isEnabled } = req.body;
      const existing = await db.select().from(schema.stripeSettings).limit(1);

      if (existing.length === 0) {
        const created = await db
          .insert(schema.stripeSettings)
          .values({ isEnabled: isEnabled ?? false })
          .returning();
        stripeService.invalidateStripeCache();
        return res.json(created[0]);
      }

      const updated = await db
        .update(schema.stripeSettings)
        .set({ isEnabled, updatedAt: new Date() })
        .where(eq(schema.stripeSettings.id, existing[0].id))
        .returning();

      stripeService.invalidateStripeCache();
      res.json(updated[0]);
    } catch (error) {
      console.error("Error toggling Stripe:", error);
      res.status(500).json({ error: "Failed to toggle Stripe" });
    }
  });

  // Switch between test/live mode
  app.patch("/api/admin/stripe/mode", devAdmin, async (req: Request, res: Response) => {
    try {
      const { mode } = req.body; // 'test' | 'live'
      if (!["test", "live"].includes(mode)) {
        return res.status(400).json({ error: "Mode must be 'test' or 'live'" });
      }

      const existing = await db.select().from(schema.stripeSettings).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "No Stripe settings found. Save settings first." });
      }

      const updated = await db
        .update(schema.stripeSettings)
        .set({ mode, updatedAt: new Date() })
        .where(eq(schema.stripeSettings.id, existing[0].id))
        .returning();

      stripeService.invalidateStripeCache();
      res.json(updated[0]);
    } catch (error) {
      console.error("Error switching Stripe mode:", error);
      res.status(500).json({ error: "Failed to switch Stripe mode" });
    }
  });

  // Test Stripe connection
  app.post("/api/admin/stripe/test", devAdmin, async (_req: Request, res: Response) => {
    try {
      const stripe = await stripeService.getStripe();
      if (!stripe) {
        return res.json({ success: false, error: "Stripe not configured or disabled" });
      }

      // Try to list a single payment intent to verify the key works
      await stripe.paymentIntents.list({ limit: 1 });
      res.json({ success: true, message: "Stripe connection successful!" });
    } catch (error: any) {
      console.error("Stripe test error:", error);
      res.json({ success: false, error: error.message || "Connection failed" });
    }
  });

  // Get all Stripe payments (admin view)
  app.get("/api/admin/stripe/payments", devAdmin, async (_req: Request, res: Response) => {
    try {
      const payments = await stripeService.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching Stripe payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Refund a payment
  app.post("/api/admin/stripe/refund/:paymentId", devAdmin, async (req: Request, res: Response) => {
    try {
      const { amount } = req.body; // optional partial refund
      const success = await stripeService.refundPayment(req.params.paymentId, amount);

      if (!success) {
        return res.status(400).json({ error: "Refund failed. Payment not found or Stripe not configured." });
      }

      res.json({ success: true, message: "Refund processed" });
    } catch (error: any) {
      console.error("Refund error:", error);
      res.status(500).json({ error: error.message || "Refund failed" });
    }
  });

  console.log("Stripe admin routes registered");

  // ============ INVITE CODES ============

  // List all invite codes
  app.get("/api/admin/invite-codes", devAdmin, async (_req, res) => {
    try {
      const codes = await db.select().from(schema.inviteCodes)
        .orderBy(desc(schema.inviteCodes.createdAt));
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invite codes" });
    }
  });

  // Create invite code(s)
  app.post("/api/admin/invite-codes", devAdmin, async (req, res) => {
    try {
      const { code, label, maxUses, hashrateOverride, durationOverride, dailyReturnOverride, validUntil, batch } = req.body;

      if (batch && typeof batch === "number" && batch > 1) {
        // Bulk generate
        const prefix = code || "BLOCK";
        const values = Array.from({ length: batch }, (_, i) => ({
          code: `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          label: label || null,
          maxUses: maxUses || 1,
          hashrateOverride: hashrateOverride || null,
          durationOverride: durationOverride || null,
          dailyReturnOverride: dailyReturnOverride || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: true,
        }));
        const inserted = await db.insert(schema.inviteCodes).values(values).returning();
        return res.json(inserted);
      }

      const [inserted] = await db.insert(schema.inviteCodes).values({
        code: code || `BLOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        label: label || null,
        maxUses: maxUses || 1,
        hashrateOverride: hashrateOverride || null,
        durationOverride: durationOverride || null,
        dailyReturnOverride: dailyReturnOverride || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: true,
      }).returning();
      res.json(inserted);
    } catch (error: any) {
      if (error.code === "23505") return res.status(409).json({ error: "Code already exists" });
      res.status(500).json({ error: "Failed to create invite code" });
    }
  });

  // Toggle invite code active state
  app.patch("/api/admin/invite-codes/:id", devAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(schema.inviteCodes)
        .set(req.body)
        .where(eq(schema.inviteCodes.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invite code" });
    }
  });

  // Delete invite code
  app.delete("/api/admin/invite-codes/:id", devAdmin, async (req, res) => {
    try {
      await db.delete(schema.inviteCodes).where(eq(schema.inviteCodes.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invite code" });
    }
  });

  // List invite code redemptions
  app.get("/api/admin/invite-codes/redemptions", devAdmin, async (_req, res) => {
    try {
      const redemptions = await db
        .select({
          id: schema.inviteCodeRedemptions.id,
          redeemedAt: schema.inviteCodeRedemptions.redeemedAt,
          codeId: schema.inviteCodeRedemptions.codeId,
          code: schema.inviteCodes.code,
          label: schema.inviteCodes.label,
          userId: schema.inviteCodeRedemptions.userId,
          userEmail: schema.users.email,
          userDisplayName: schema.users.displayName,
          starterRewardId: schema.inviteCodeRedemptions.starterRewardId,
        })
        .from(schema.inviteCodeRedemptions)
        .leftJoin(schema.inviteCodes, eq(schema.inviteCodeRedemptions.codeId, schema.inviteCodes.id))
        .leftJoin(schema.users, eq(schema.inviteCodeRedemptions.userId, schema.users.id))
        .orderBy(desc(schema.inviteCodeRedemptions.redeemedAt));
      res.json(redemptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch redemptions" });
    }
  });

  // ============ FREE MINERS (invite-code starter rewards) ============

  // List all free miners granted via invite codes
  app.get("/api/admin/free-miners", devAdmin, async (_req, res) => {
    try {
      const freeMiners = await db
        .select({
          rewardId: schema.starterRewards.id,
          userId: schema.starterRewards.userId,
          userEmail: schema.users.email,
          userDisplayName: schema.users.displayName,
          status: schema.starterRewards.status,
          hashrate: schema.starterRewards.hashrate,
          hashrateUnit: schema.starterRewards.hashrateUnit,
          durationDays: schema.starterRewards.durationDays,
          totalEarned: schema.starterRewards.totalEarned,
          activatedAt: schema.starterRewards.activatedAt,
          expiresAt: schema.starterRewards.expiresAt,
          revokedAt: schema.starterRewards.revokedAt,
          revocationReason: schema.starterRewards.revocationReason,
          miningPurchaseId: schema.starterRewards.miningPurchaseId,
          miningStatus: schema.miningPurchases.status,
          inviteCode: schema.inviteCodes.code,
          inviteLabel: schema.inviteCodes.label,
        })
        .from(schema.starterRewards)
        .leftJoin(schema.users, eq(schema.starterRewards.userId, schema.users.id))
        .leftJoin(schema.miningPurchases, eq(schema.starterRewards.miningPurchaseId, schema.miningPurchases.id))
        .leftJoin(schema.inviteCodeRedemptions, eq(schema.starterRewards.id, schema.inviteCodeRedemptions.starterRewardId))
        .leftJoin(schema.inviteCodes, eq(schema.inviteCodeRedemptions.codeId, schema.inviteCodes.id))
        .orderBy(desc(schema.starterRewards.activatedAt));
      res.json(freeMiners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch free miners" });
    }
  });

  // Pause / resume a free miner (updates both starter_rewards and mining_purchases)
  app.post("/api/admin/free-miners/:rewardId/toggle", devAdmin, async (req, res) => {
    try {
      const reward = await db.select().from(schema.starterRewards)
        .where(eq(schema.starterRewards.id, req.params.rewardId));
      if (!reward[0]) return res.status(404).json({ error: "Reward not found" });

      const newStatus = reward[0].status === "active" ? "revoked" : "active";
      const now = new Date();

      await db.update(schema.starterRewards)
        .set({
          status: newStatus,
          revokedAt: newStatus === "revoked" ? now : null,
          revocationReason: newStatus === "revoked" ? (req.body.reason || "Admin paused") : null,
        })
        .where(eq(schema.starterRewards.id, req.params.rewardId));

      if (reward[0].miningPurchaseId) {
        await db.update(schema.miningPurchases)
          .set({ status: newStatus === "revoked" ? "cancelled" : "active" })
          .where(eq(schema.miningPurchases.id, reward[0].miningPurchaseId));
      }

      res.json({ success: true, newStatus });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle free miner" });
    }
  });

  // ============ USER MINING PURCHASE MANAGEMENT ============

  // List all mining purchases with user info
  app.get("/api/admin/mining-purchases", devAdmin, async (_req, res) => {
    try {
      const purchases = await db
        .select({
          id: schema.miningPurchases.id,
          userId: schema.miningPurchases.userId,
          userEmail: schema.users.email,
          userDisplayName: schema.users.displayName,
          packageName: schema.miningPurchases.packageName,
          crypto: schema.miningPurchases.crypto,
          amount: schema.miningPurchases.amount,
          hashrate: schema.miningPurchases.hashrate,
          hashrateUnit: schema.miningPurchases.hashrateUnit,
          status: schema.miningPurchases.status,
          totalEarned: schema.miningPurchases.totalEarned,
          purchaseDate: schema.miningPurchases.purchaseDate,
          expiryDate: schema.miningPurchases.expiryDate,
        })
        .from(schema.miningPurchases)
        .leftJoin(schema.users, eq(schema.miningPurchases.userId, schema.users.id))
        .orderBy(desc(schema.miningPurchases.purchaseDate));
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mining purchases" });
    }
  });

  // Pause / resume / cancel a specific mining purchase
  app.post("/api/admin/mining-purchases/:id/status", devAdmin, async (req, res) => {
    try {
      const { status } = req.body; // 'active' | 'cancelled' | 'paused'
      if (!["active", "cancelled", "paused"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const [updated] = await db.update(schema.miningPurchases)
        .set({ status })
        .where(eq(schema.miningPurchases.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mining purchase status" });
    }
  });
}
