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
    
    // SECURITY: Only allow specific admin email
    const ADMIN_EMAIL = "abdohassan777@gmail.com";
    if (decodedToken.email !== ADMIN_EMAIL) {
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

  console.log("Admin routes registered");
}
