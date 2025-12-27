// Admin API routes for full control of the app
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { verifyIdToken, setCustomClaims } from "./firebase-admin";

// Middleware to verify admin authentication
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(idToken);
    
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

export function registerAdminRoutes(app: Express) {
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

  // ============ MAIN WALLET (App Treasury) ============
  
  // Get main wallets
  app.get("/api/admin/main-wallet", devAdmin, async (_req, res) => {
    try {
      const wallets = await db.select().from(schema.mainWallet);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch main wallet" });
    }
  });

  // Update main wallet
  app.patch("/api/admin/main-wallet/:symbol", devAdmin, async (req, res) => {
    try {
      const { balance, address } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (balance !== undefined) updateData.balance = balance;
      if (address) updateData.address = address;

      const wallets = await db.update(schema.mainWallet)
        .set(updateData)
        .where(eq(schema.mainWallet.symbol, req.params.symbol))
        .returning();
      
      if (wallets.length === 0) {
        // Create if doesn't exist
        const newWallet = await db.insert(schema.mainWallet)
          .values({ symbol: req.params.symbol, balance: balance || 0, address })
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
      
      // Get current balance
      const wallets = await db.select().from(schema.mainWallet)
        .where(eq(schema.mainWallet.symbol, req.params.symbol));
      
      if (wallets.length === 0 || wallets[0].balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Update balance
      await db.update(schema.mainWallet)
        .set({ balance: wallets[0].balance - amount, updatedAt: new Date() })
        .where(eq(schema.mainWallet.symbol, req.params.symbol));

      // Record transaction
      await db.insert(schema.transactions).values({
        userId: "system",
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
      const mainWallets = await db.select().from(schema.mainWallet);
      
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

  console.log("Admin routes registered");
}
