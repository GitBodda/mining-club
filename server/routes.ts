import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  users, depositAddresses, ledgerEntries, withdrawalRequests, 
  adminActions, networkConfig, blockchainDeposits, interestPayments,
  miningPurchases
} from "@shared/schema";
import { blockchainService } from "./services/blockchain";
import { getMasterWalletService } from "./services/hdWalletService";
import { eq, and, desc } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Mining Stats
  app.get("/api/mining/stats", async (_req, res) => {
    try {
      const stats = await storage.getMiningStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mining stats" });
    }
  });

  app.post("/api/mining/toggle", async (_req, res) => {
    try {
      const currentStats = await storage.getMiningStats();
      const updatedStats = await storage.updateMiningStats({ 
        isActive: !currentStats.isActive 
      });
      res.json(updatedStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle mining" });
    }
  });

  // Wallet
  app.get("/api/wallet/balances", async (_req, res) => {
    try {
      const balances = await storage.getWalletBalances();
      const totalBalance = balances.reduce((sum, b) => sum + b.usdValue, 0);
      const change24h = storage.get24hChange();
      res.json({ balances, totalBalance, change24h });
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallet balances" });
    }
  });

  app.get("/api/wallet/transactions", async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Mining Pools
  app.get("/api/pools", async (_req, res) => {
    try {
      const pools = await storage.getMiningPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mining pools" });
    }
  });

  app.post("/api/pools/:id/select", async (req, res) => {
    try {
      const pools = await storage.selectPool(req.params.id);
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: "Failed to select pool" });
    }
  });

  // Chart Data
  app.get("/api/chart", async (_req, res) => {
    try {
      const chartData = await storage.getChartData();
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chart data" });
    }
  });

  // Portfolio History (7-day)
  app.get("/api/portfolio/history", async (_req, res) => {
    try {
      // Return actual portfolio history for the last 7 days
      const data = [];
      const now = new Date();
      const balances = await storage.getWalletBalances();
      const currentValue = balances.reduce((sum, b) => sum + b.usdValue, 0);

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        
        data.push({
          day: dayName,
          value: currentValue, // Use actual balance value
          timestamp: date.toISOString(),
        });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio history" });
    }
  });

  // Settings
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const allowedKeys = ['miningIntensity', 'notificationsEnabled', 'powerSaver', 'selectedPool', 'twoFactorEnabled', 'biometricEnabled', 'currency', 'language', 'sessionTimeout'];
      const validatedSettings: Record<string, any> = {};
      
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          validatedSettings[key] = req.body[key];
        }
      }
      
      const settings = await storage.updateSettings(validatedSettings);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // =====================================================
  // WALLET & DEPOSIT ADDRESS ROUTES
  // =====================================================

  // Get or generate deposit address for a user
  app.post("/api/wallet/deposit-address", async (req, res) => {
    try {
      const { userId, network, symbol } = req.body;
      
      if (!userId || !network || !symbol) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if address already exists
      const existing = await db.select()
        .from(depositAddresses)
        .where(
          and(
            eq(depositAddresses.userId, userId),
            eq(depositAddresses.network, network),
            eq(depositAddresses.symbol, symbol)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.json({ address: existing[0].address, existing: true });
      }

      // Get next derivation index
      const maxIndex = await db.select()
        .from(depositAddresses)
        .orderBy(desc(depositAddresses.derivationIndex))
        .limit(1);

      const nextIndex = maxIndex.length > 0 ? maxIndex[0].derivationIndex + 1 : 1;

      // Generate address from HD wallet based on cryptocurrency type
      let address: string | null = null;
      
      // Get HD wallet service
      const hdWallet = getMasterWalletService();
      
      if (symbol === 'BTC' && hdWallet) {
        // Bitcoin address generation
        const btcAddress = hdWallet.generateBitcoinAddress(nextIndex);
        address = btcAddress.address;
      } else if (symbol === 'LTC' && hdWallet) {
        // Litecoin address generation
        const ltcAddress = hdWallet.generateLitecoinAddress(nextIndex);
        address = ltcAddress.address;
      } else if (symbol === 'ZCASH' && hdWallet) {
        // Zcash address generation
        const zcashAddress = hdWallet.generateZcashAddress(nextIndex);
        address = zcashAddress.address;
      } else if ((symbol === 'ETH' || symbol === 'USDT' || symbol === 'USDC' || symbol === 'BNB') && hdWallet) {
        // Ethereum and EVM tokens use the same address
        const ethAddress = hdWallet.generateEthereumAddress(nextIndex);
        address = ethAddress.address;
      } else {
        // Fallback to EVM blockchain service
        address = blockchainService.deriveDepositAddress(nextIndex);
      }
      
      if (!address) {
        return res.status(500).json({ error: "HD wallet not initialized or address generation failed" });
      }

      // Save to database
      const [newAddress] = await db.insert(depositAddresses).values({
        userId,
        network,
        symbol,
        address,
        derivationIndex: nextIndex,
      }).returning();

      res.json({ address: newAddress.address, existing: false });
    } catch (error) {
      console.error("Generate deposit address error:", error);
      res.status(500).json({ error: "Failed to generate deposit address" });
    }
  });

  // Get all deposit addresses for a user
  app.get("/api/wallet/deposit-addresses/:userId", async (req, res) => {
    try {
      const addresses = await db.select()
        .from(depositAddresses)
        .where(eq(depositAddresses.userId, req.params.userId));
      
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deposit addresses" });
    }
  });

  // Get user's ledger balance for a specific symbol
  app.get("/api/wallet/ledger-balance/:userId/:symbol", async (req, res) => {
    try {
      const { userId, symbol } = req.params;
      
      // Get the latest ledger entry for this user and symbol
      const latestEntry = await db.select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, userId),
            eq(ledgerEntries.symbol, symbol)
          )
        )
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(1);

      const balance = latestEntry.length > 0 ? latestEntry[0].balanceAfter : 0;
      res.json({ symbol, balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to get ledger balance" });
    }
  });

  // Get all ledger balances for a user
  app.get("/api/wallet/ledger-balances/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get latest balance for each symbol
      const entries = await db.select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.userId, userId))
        .orderBy(desc(ledgerEntries.createdAt));

      // Group by symbol and get latest balance
      const balanceMap: Record<string, number> = {};
      for (const entry of entries) {
        if (!(entry.symbol in balanceMap)) {
          balanceMap[entry.symbol] = entry.balanceAfter;
        }
      }

      res.json(balanceMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ledger balances" });
    }
  });

  // Create withdrawal request
  app.post("/api/wallet/withdraw", async (req, res) => {
    try {
      const { userId, symbol, network, amount, toAddress } = req.body;
      
      if (!userId || !symbol || !network || !amount || !toAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate address
      if (!blockchainService.isValidAddress(toAddress)) {
        return res.status(400).json({ error: "Invalid withdrawal address" });
      }

      // Get current balance
      const latestEntry = await db.select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, userId),
            eq(ledgerEntries.symbol, symbol)
          )
        )
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(1);

      const currentBalance = latestEntry.length > 0 ? latestEntry[0].balanceAfter : 0;

      // Get network config for fee
      const networkCfg = await db.select()
        .from(networkConfig)
        .where(eq(networkConfig.network, network))
        .limit(1);

      const fee = networkCfg.length > 0 ? networkCfg[0].withdrawalFee : 0;
      const minWithdrawal = networkCfg.length > 0 ? networkCfg[0].minWithdrawal : 0;

      if (amount < minWithdrawal) {
        return res.status(400).json({ 
          error: `Minimum withdrawal is ${minWithdrawal} ${symbol}` 
        });
      }

      const totalRequired = amount + fee;
      if (currentBalance < totalRequired) {
        return res.status(400).json({ 
          error: "Insufficient balance",
          balance: currentBalance,
          required: totalRequired
        });
      }

      const netAmount = amount - fee;

      // Create withdrawal request
      const [request] = await db.insert(withdrawalRequests).values({
        userId,
        symbol,
        network,
        amount,
        fee,
        netAmount,
        toAddress,
        status: "pending",
      }).returning();

      res.json({ 
        success: true, 
        requestId: request.id,
        message: "Withdrawal request submitted for approval"
      });
    } catch (error) {
      console.error("Withdrawal request error:", error);
      res.status(500).json({ error: "Failed to create withdrawal request" });
    }
  });

  // Get user's withdrawal history
  app.get("/api/wallet/withdrawals/:userId", async (req, res) => {
    try {
      const withdrawals = await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, req.params.userId))
        .orderBy(desc(withdrawalRequests.requestedAt));
      
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get withdrawal history" });
    }
  });

  // Get user's transaction/ledger history
  app.get("/api/wallet/ledger/:userId", async (req, res) => {
    try {
      const entries = await db.select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.userId, req.params.userId))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(100);
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ledger history" });
    }
  });

  // =====================================================
  // ADMIN ROUTES
  // =====================================================

  // Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Get user details with balances
  app.get("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all ledger balances
      const entries = await db.select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.userId, userId))
        .orderBy(desc(ledgerEntries.createdAt));

      const balances: Record<string, number> = {};
      for (const entry of entries) {
        if (!(entry.symbol in balances)) {
          balances[entry.symbol] = entry.balanceAfter;
        }
      }

      // Get deposit addresses
      const addresses = await db.select()
        .from(depositAddresses)
        .where(eq(depositAddresses.userId, userId));

      // Get withdrawal requests
      const withdrawals = await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, userId))
        .orderBy(desc(withdrawalRequests.requestedAt))
        .limit(20);

      res.json({ user, balances, addresses, withdrawals });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user details" });
    }
  });

  // Admin: Credit or debit user balance
  app.post("/api/admin/adjust-balance", async (req, res) => {
    try {
      const { adminId, targetUserId, symbol, amount, type, note } = req.body;

      if (!adminId || !targetUserId || !symbol || amount === undefined || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["credit", "debit"].includes(type)) {
        return res.status(400).json({ error: "Type must be 'credit' or 'debit'" });
      }

      // Get current balance
      const latestEntry = await db.select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, targetUserId),
            eq(ledgerEntries.symbol, symbol)
          )
        )
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(1);

      const balanceBefore = latestEntry.length > 0 ? latestEntry[0].balanceAfter : 0;
      const adjustedAmount = type === "credit" ? Math.abs(amount) : -Math.abs(amount);
      const balanceAfter = balanceBefore + adjustedAmount;

      if (balanceAfter < 0) {
        return res.status(400).json({ 
          error: "Insufficient balance for debit",
          currentBalance: balanceBefore
        });
      }

      // Create ledger entry
      const [entry] = await db.insert(ledgerEntries).values({
        userId: targetUserId,
        symbol,
        type: `admin_${type}`,
        amount: Math.abs(amount),
        balanceBefore,
        balanceAfter,
        referenceType: "admin_action",
        note: note || `Admin ${type} by ${adminId}`,
        adminId,
      }).returning();

      // Log admin action
      await db.insert(adminActions).values({
        adminId,
        targetUserId,
        actionType: `balance_${type}`,
        details: { symbol, amount, balanceBefore, balanceAfter, note },
      });

      res.json({ 
        success: true, 
        entry,
        newBalance: balanceAfter
      });
    } catch (error) {
      console.error("Admin adjust balance error:", error);
      res.status(500).json({ error: "Failed to adjust balance" });
    }
  });

  // Admin: Get pending withdrawals
  app.get("/api/admin/withdrawals/pending", async (_req, res) => {
    try {
      const pending = await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.status, "pending"))
        .orderBy(desc(withdrawalRequests.requestedAt));
      
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pending withdrawals" });
    }
  });

  // Admin: Approve or reject withdrawal
  app.post("/api/admin/withdrawals/:id/process", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId, action, txHash, note } = req.body;

      if (!adminId || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const [request] = await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, id));

      if (!request) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
      }

      if (action === "approve") {
        // Deduct from user's balance
        const latestEntry = await db.select()
          .from(ledgerEntries)
          .where(
            and(
              eq(ledgerEntries.userId, request.userId),
              eq(ledgerEntries.symbol, request.symbol)
            )
          )
          .orderBy(desc(ledgerEntries.createdAt))
          .limit(1);

        const balanceBefore = latestEntry.length > 0 ? latestEntry[0].balanceAfter : 0;
        const balanceAfter = balanceBefore - request.amount;

        if (balanceAfter < 0) {
          return res.status(400).json({ error: "Insufficient balance" });
        }

        // Create ledger entry for withdrawal
        await db.insert(ledgerEntries).values({
          userId: request.userId,
          symbol: request.symbol,
          network: request.network,
          type: "withdrawal",
          amount: request.amount,
          balanceBefore,
          balanceAfter,
          referenceType: "withdrawal",
          referenceId: request.id,
          txHash,
          adminId,
        });

        // Update withdrawal request
        await db.update(withdrawalRequests)
          .set({
            status: "completed",
            txHash,
            adminId,
            adminNote: note,
            processedAt: new Date(),
            completedAt: new Date(),
          })
          .where(eq(withdrawalRequests.id, id));

      } else {
        // Reject withdrawal
        await db.update(withdrawalRequests)
          .set({
            status: "rejected",
            adminId,
            rejectionReason: note,
            rejectedAt: new Date(),
          })
          .where(eq(withdrawalRequests.id, id));
      }

      // Log admin action
      await db.insert(adminActions).values({
        adminId,
        targetUserId: request.userId,
        actionType: `withdrawal_${action}`,
        details: { withdrawalId: id, amount: request.amount, symbol: request.symbol, txHash, note },
      });

      res.json({ success: true, action });
    } catch (error) {
      console.error("Process withdrawal error:", error);
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Admin: Get admin action logs
  app.get("/api/admin/logs", async (_req, res) => {
    try {
      const logs = await db.select()
        .from(adminActions)
        .orderBy(desc(adminActions.createdAt))
        .limit(100);
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get admin logs" });
    }
  });

  // Admin: Get network configurations
  app.get("/api/admin/networks", async (_req, res) => {
    try {
      const networks = await db.select().from(networkConfig);
      res.json(networks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get network config" });
    }
  });

  // Admin: Update network configuration
  app.patch("/api/admin/networks/:network", async (req, res) => {
    try {
      const { network: networkName } = req.params;
      const updates = req.body;

      const [updated] = await db.update(networkConfig)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(networkConfig.network, networkName))
        .returning();

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update network config" });
    }
  });

  // Blockchain service status
  app.get("/api/blockchain/status", async (_req, res) => {
    res.json({
      initialized: blockchainService.isInitialized(),
      masterAddress: blockchainService.getMasterAddress(),
    });
  });

  // =====================================================
  // NOTIFICATION ROUTES
  // =====================================================

  // Get user notifications
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const includeRead = req.query.includeRead !== "false";

      const { notificationService } = await import("./services/notificationService");
      const notifications = await notificationService.getUserNotifications(userId, limit, includeRead);
      const unreadCount = await notificationService.getUnreadCount(userId);

      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const { notificationService } = await import("./services/notificationService");
      await notificationService.markAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read for a user
  app.post("/api/notifications/:userId/mark-all-read", async (req, res) => {
    try {
      const { userId } = req.params;
      const { notificationService } = await import("./services/notificationService");
      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const { notificationService } = await import("./services/notificationService");
      await notificationService.delete(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Admin: Get admin notifications
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const includeRead = req.query.includeRead !== "false";

      const { notificationService } = await import("./services/notificationService");
      const notifications = await notificationService.getAdminNotifications(limit, includeRead);
      const unreadCount = await notificationService.getUnreadAdminCount();

      res.json({ notifications, unreadCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to get admin notifications" });
    }
  });

  // Admin: Send broadcast notification
  app.post("/api/admin/notifications/broadcast", async (req, res) => {
    try {
      const { title, message, type = "promotion" } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }

      const { notificationService } = await import("./services/notificationService");
      const count = await notificationService.createBroadcast(title, message, type);
      res.json({ success: true, notificationsSent: count });
    } catch (error) {
      res.status(500).json({ error: "Failed to send broadcast notification" });
    }
  });

  // Admin: Send notification to specific user
  app.post("/api/admin/notifications/send", async (req, res) => {
    try {
      const { userId, title, message, type = "system", priority = "normal" } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ error: "userId, title and message are required" });
      }

      const { notificationService } = await import("./services/notificationService");
      const notification = await notificationService.create({
        userId,
        type,
        title,
        message,
        priority,
      });
      res.json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // =====================================================
  // SUPPORT TICKET ROUTES
  // =====================================================

  // Create support ticket
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const { userId, subject, description, category = "general", priority = "normal" } = req.body;
      
      if (!userId || !subject || !description) {
        return res.status(400).json({ error: "userId, subject and description are required" });
      }

      const { supportTickets } = await import("@shared/schema");
      const [ticket] = await db.insert(supportTickets).values({
        userId,
        subject,
        description,
        category,
        priority,
      }).returning();

      // Notify admins
      const { notificationService } = await import("./services/notificationService");
      await notificationService.notifyAdminSupportTicket(ticket.id, subject, userId);

      res.json(ticket);
    } catch (error) {
      console.error("Create ticket error:", error);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  // Get user's tickets
  app.get("/api/support/tickets/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { supportTickets } = await import("@shared/schema");
      
      const tickets = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt));

      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to get support tickets" });
    }
  });

  // Get ticket messages
  app.get("/api/support/tickets/:ticketId/messages", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { ticketMessages } = await import("@shared/schema");
      
      const messages = await db.select()
        .from(ticketMessages)
        .where(eq(ticketMessages.ticketId, ticketId))
        .orderBy(ticketMessages.createdAt);

      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ticket messages" });
    }
  });

  // Add message to ticket
  app.post("/api/support/tickets/:ticketId/messages", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { userId, message, isAdmin = false } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "userId and message are required" });
      }

      const { ticketMessages, supportTickets } = await import("@shared/schema");
      
      const [msg] = await db.insert(ticketMessages).values({
        ticketId,
        userId,
        message,
        isAdmin,
      }).returning();

      // Update ticket updated time
      await db.update(supportTickets)
        .set({ updatedAt: new Date() })
        .where(eq(supportTickets.id, ticketId));

      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: "Failed to add message" });
    }
  });

  // =====================================================
  // USER NOTIFICATION PREFERENCES
  // =====================================================

  // Get notification preferences
  app.get("/api/users/:userId/notification-preferences", async (req, res) => {
    try {
      const { userId } = req.params;
      const { notificationPreferences } = await import("@shared/schema");
      
      const prefs = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      if (prefs.length === 0) {
        // Return defaults
        res.json({
          deposits: true,
          withdrawals: true,
          rewards: true,
          dailyReturns: true,
          promotions: true,
          systemAlerts: true,
          emailNotifications: true,
          pushNotifications: true,
        });
      } else {
        res.json(prefs[0]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get notification preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/users/:userId/notification-preferences", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const { userService } = await import("./services/userService");
      
      const prefs = await userService.updateNotificationPreferences(userId, updates);
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // =====================================================
  // EARN/YIELD PLANS (Public Routes)
  // =====================================================

  // Get active earn plans
  app.get("/api/earn-plans", async (_req, res) => {
    try {
      const { earnPlans } = await import("@shared/schema");
      const plans = await db.select()
        .from(earnPlans)
        .where(eq(earnPlans.isActive, true))
        .orderBy(earnPlans.order);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to get earn plans" });
    }
  });

  // Get earn APR rates
  app.get("/api/earn-rates", async (_req, res) => {
    try {
      const { earnPageSettings } = await import("@shared/schema");
      const settings = await db.select().from(earnPageSettings);
      
      // Default rates if not configured
      const defaultRates = {
        daily: { rate: 17.9, label: "Daily", period: 1 },
        weekly: { rate: 18.0, label: "Weekly", period: 7 },
        monthly: { rate: 18.25, label: "Monthly", period: 30 },
        quarterly: { rate: 18.7, label: "Quarterly", period: 90 },
        yearly: { rate: 19.25, label: "Yearly", period: 365 },
      };

      // Override with admin settings if available
      const dailySetting = settings.find(s => s.key === "daily_apr");
      const weeklySetting = settings.find(s => s.key === "weekly_apr");
      const monthlySetting = settings.find(s => s.key === "monthly_apr");
      const quarterlySetting = settings.find(s => s.key === "quarterly_apr");
      const yearlySetting = settings.find(s => s.key === "yearly_apr");

      if (dailySetting) defaultRates.daily.rate = parseFloat(dailySetting.value);
      if (weeklySetting) defaultRates.weekly.rate = parseFloat(weeklySetting.value);
      if (monthlySetting) defaultRates.monthly.rate = parseFloat(monthlySetting.value);
      if (quarterlySetting) defaultRates.quarterly.rate = parseFloat(quarterlySetting.value);
      if (yearlySetting) defaultRates.yearly.rate = parseFloat(yearlySetting.value);

      res.json(defaultRates);
    } catch (error) {
      res.status(500).json({ error: "Failed to get earn rates" });
    }
  });

  // Get earn FAQs (public)
  app.get("/api/content/earn-faqs", async (_req, res) => {
    try {
      const { earnFaqs } = await import("@shared/schema");
      const faqs = await db.select()
        .from(earnFaqs)
        .where(eq(earnFaqs.isActive, true))
        .orderBy(earnFaqs.order);
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get earn FAQs" });
    }
  });

  // Create earn subscription (user invests in earn plan)
  app.post("/api/earn/subscribe", async (req, res) => {
    try {
      const { userId, planId, amount, symbol, durationType, aprRate } = req.body;
      const { earnSubscriptions, wallets } = await import("@shared/schema");
      
      // Check user has sufficient balance
      const userWallets = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.symbol, symbol)));
      
      if (userWallets.length === 0 || userWallets[0].balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct from wallet
      await db.update(wallets)
        .set({ balance: userWallets[0].balance - amount })
        .where(eq(wallets.id, userWallets[0].id));

      // Create subscription
      const subscription = await db.insert(earnSubscriptions).values({
        userId,
        planId,
        amount,
        symbol,
        durationType,
        aprRate,
        status: "active",
      }).returning();

      res.json(subscription[0]);
    } catch (error) {
      console.error("Error creating earn subscription:", error);
      res.status(500).json({ error: "Failed to create earn subscription" });
    }
  });

  // Withdraw from earn subscription
  app.post("/api/earn/withdraw/:subscriptionId", async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { earnSubscriptions, wallets } = await import("@shared/schema");
      
      // Get subscription
      const subs = await db.select()
        .from(earnSubscriptions)
        .where(eq(earnSubscriptions.id, subscriptionId));
      
      if (subs.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const sub = subs[0];
      if (sub.status !== "active") {
        return res.status(400).json({ error: "Subscription is not active" });
      }

      // Return principal + earnings to wallet
      const totalAmount = sub.amount + sub.totalEarned;
      const userWallets = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, sub.userId), eq(wallets.symbol, sub.symbol)));
      
      if (userWallets.length > 0) {
        await db.update(wallets)
          .set({ balance: userWallets[0].balance + totalAmount })
          .where(eq(wallets.id, userWallets[0].id));
      }

      // Mark as withdrawn
      await db.update(earnSubscriptions)
        .set({ status: "withdrawn", withdrawnAt: new Date() })
        .where(eq(earnSubscriptions.id, subscriptionId));

      res.json({ success: true, amountReturned: totalAmount });
    } catch (error) {
      console.error("Error withdrawing from earn subscription:", error);
      res.status(500).json({ error: "Failed to withdraw" });
    }
  });

  // Get user's earn subscriptions
  app.get("/api/users/:userId/earn-subscriptions", async (req, res) => {
    try {
      const { userId } = req.params;
      const { earnSubscriptions } = await import("@shared/schema");
      
      const subs = await db.select()
        .from(earnSubscriptions)
        .where(eq(earnSubscriptions.userId, userId))
        .orderBy(desc(earnSubscriptions.startDate));
      
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get earn subscriptions" });
    }
  });

  // Mining purchase - buy hashpower or device
  app.post("/api/mining/purchase", async (req, res) => {
    try {
      const { 
        userId, 
        packageName, 
        crypto, 
        amount, 
        hashrate, 
        hashrateUnit, 
        efficiency,
        dailyReturnBTC, 
        returnPercent,
        paybackMonths
      } = req.body;
      const { miningPurchases, wallets, orders, notifications } = await import("@shared/schema");
      
      // Check user has sufficient USDT balance
      const userWallets = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.symbol, "USDT")));
      
      if (userWallets.length === 0 || userWallets[0].balance < amount) {
        return res.status(400).json({ error: "Insufficient USDT balance" });
      }

      // Deduct from wallet
      await db.update(wallets)
        .set({ balance: userWallets[0].balance - amount })
        .where(eq(wallets.id, userWallets[0].id));

      // Create mining purchase
      const purchase = await db.insert(miningPurchases).values({
        userId,
        packageName,
        crypto,
        amount,
        hashrate,
        hashrateUnit,
        efficiency,
        dailyReturnBTC,
        returnPercent,
        paybackMonths,
        status: "active",
      }).returning();

      // Create order record for tracking
      await db.insert(orders).values({
        userId,
        type: "mining_purchase",
        productId: purchase[0].id,
        productName: `${crypto} Mining - ${packageName} (${hashrate} ${hashrateUnit})`,
        amount,
        currency: "USDT",
        paymentMethod: "balance",
        balanceDeducted: true,
        status: "completed",
        completedAt: new Date(),
        metadata: { crypto, hashrate, hashrateUnit, efficiency, dailyReturnBTC, returnPercent, paybackMonths },
      });

      // Create notification
      await db.insert(notifications).values({
        userId,
        type: "purchase",
        category: "user",
        title: "Mining Package Activated!",
        message: `Your ${packageName} ${crypto} mining package (${hashrate} ${hashrateUnit}) is now active and earning rewards.`,
        priority: "normal",
        data: { purchaseId: purchase[0].id, packageName, crypto, hashrate },
      });

      res.json(purchase[0]);
    } catch (error) {
      console.error("Error creating mining purchase:", error);
      res.status(500).json({ error: "Failed to create mining purchase" });
    }
  });

  // Get user's mining purchases
  app.get("/api/users/:userId/mining-purchases", async (req, res) => {
    try {
      const { userId } = req.params;
      const { miningPurchases } = await import("@shared/schema");
      
      const purchases = await db.select()
        .from(miningPurchases)
        .where(eq(miningPurchases.userId, userId))
        .orderBy(desc(miningPurchases.purchaseDate));
      
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mining purchases" });
    }
  });

  // Cancel/withdraw from mining purchase
  app.post("/api/mining/withdraw/:purchaseId", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { miningPurchases, wallets } = await import("@shared/schema");
      
      // Get purchase
      const purchases = await db.select()
        .from(miningPurchases)
        .where(eq(miningPurchases.id, purchaseId));
      
      if (purchases.length === 0) {
        return res.status(404).json({ error: "Mining purchase not found" });
      }

      const purchase = purchases[0];
      if (purchase.status !== "active") {
        return res.status(400).json({ error: "Mining purchase is not active" });
      }

      // Return principal + earnings to wallet (as USDT)
      const btcEarned = purchase.totalEarned;
      // Convert BTC to USDT at current rate (simplified - should fetch real rate)
      const btcPrice = 95000; // Placeholder - in real implementation, fetch from API
      const totalAmount = purchase.amount + (btcEarned * btcPrice);
      
      const userWallets = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, purchase.userId), eq(wallets.symbol, "USDT")));
      
      if (userWallets.length > 0) {
        await db.update(wallets)
          .set({ balance: userWallets[0].balance + totalAmount })
          .where(eq(wallets.id, userWallets[0].id));
      }

      // Mark as completed/cancelled
      await db.update(miningPurchases)
        .set({ status: "completed" })
        .where(eq(miningPurchases.id, purchaseId));

      res.json({ success: true, amountReturned: totalAmount });
    } catch (error) {
      console.error("Error withdrawing from mining purchase:", error);
      res.status(500).json({ error: "Failed to withdraw" });
    }
  });

  // Public API: Get active promotional offers
  app.get("/api/offers", async (_req, res) => {
    try {
      const { promotionalOffers } = await import("@shared/schema");
      const now = new Date();
      
      const offers = await db.select()
        .from(promotionalOffers)
        .where(eq(promotionalOffers.isActive, true))
        .orderBy(promotionalOffers.order);
      
      // Filter by validity dates
      const validOffers = offers.filter(o => {
        if (o.validFrom && o.validFrom > now) return false;
        if (o.validUntil && o.validUntil < now) return false;
        return true;
      });
      
      res.json(validOffers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get offers" });
    }
  });

  // ============ APP CONFIG (Database-driven settings) ============

  // Get app configuration value
  app.get("/api/config/:key", async (req, res) => {
    try {
      const { appConfig } = await import("@shared/schema");
      const config = await db.select()
        .from(appConfig)
        .where(and(eq(appConfig.key, req.params.key), eq(appConfig.isActive, true)));
      
      if (config.length === 0) {
        return res.status(404).json({ error: "Config not found" });
      }
      res.json(config[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to get config" });
    }
  });

  // Get all wallet addresses for deposits
  app.get("/api/config/wallets/all", async (_req, res) => {
    try {
      const { appConfig } = await import("@shared/schema");
      const wallets = await db.select()
        .from(appConfig)
        .where(and(
          eq(appConfig.category, "wallet"),
          eq(appConfig.isActive, true)
        ));
      
      // Convert to a map for easy access
      const walletMap: Record<string, string> = {};
      wallets.forEach(w => {
        walletMap[w.key] = w.value;
      });
      
      res.json(walletMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallet addresses" });
    }
  });

  // ============ DEPOSIT REQUESTS ============

  // Create a deposit request
  app.post("/api/deposits/request", async (req, res) => {
    try {
      const { userId, amount, currency, network, walletAddress } = req.body;
      const { depositRequests, notifications } = await import("@shared/schema");
      
      if (!userId || !amount || !currency || !network || !walletAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create deposit request
      const [request] = await db.insert(depositRequests).values({
        userId,
        amount: parseFloat(amount),
        currency,
        network,
        walletAddress,
        status: "pending",
      }).returning();

      // Create notification for user
      await db.insert(notifications).values({
        userId,
        type: "deposit",
        category: "user",
        title: "Deposit Request Created",
        message: `Your deposit request for ${amount} ${currency} has been submitted. We'll confirm it once we verify the transaction.`,
        priority: "normal",
      });

      res.json({ 
        success: true, 
        request,
        message: "Deposit request created successfully. Please wait for confirmation."
      });
    } catch (error) {
      console.error("Error creating deposit request:", error);
      res.status(500).json({ error: "Failed to create deposit request" });
    }
  });

  // Get user's deposit requests
  app.get("/api/deposits/requests/:userId", async (req, res) => {
    try {
      const { depositRequests } = await import("@shared/schema");
      const requests = await db.select()
        .from(depositRequests)
        .where(eq(depositRequests.userId, req.params.userId))
        .orderBy(desc(depositRequests.createdAt));
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deposit requests" });
    }
  });

  // Get user's pending deposits (for display)
  app.get("/api/deposits/pending/:userId", async (req, res) => {
    try {
      const { depositRequests } = await import("@shared/schema");
      const pending = await db.select()
        .from(depositRequests)
        .where(and(
          eq(depositRequests.userId, req.params.userId),
          eq(depositRequests.status, "pending")
        ))
        .orderBy(desc(depositRequests.createdAt));
      
      // Calculate total pending by currency
      const pendingByCurrency: Record<string, number> = {};
      pending.forEach(p => {
        pendingByCurrency[p.currency] = (pendingByCurrency[p.currency] || 0) + p.amount;
      });
      
      res.json({ 
        requests: pending,
        totals: pendingByCurrency
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get pending deposits" });
    }
  });

  // ============ USER BALANCE (from wallets table) ============

  // Get user balances (confirmed only)
  app.get("/api/balances/:userId", async (req, res) => {
    try {
      const { wallets } = await import("@shared/schema");
      const userWallets = await db.select()
        .from(wallets)
        .where(eq(wallets.userId, req.params.userId));
      
      // Get pending deposits
      const { depositRequests } = await import("@shared/schema");
      const pending = await db.select()
        .from(depositRequests)
        .where(and(
          eq(depositRequests.userId, req.params.userId),
          eq(depositRequests.status, "pending")
        ));
      
      const pendingByCurrency: Record<string, number> = {};
      pending.forEach(p => {
        pendingByCurrency[p.currency] = (pendingByCurrency[p.currency] || 0) + p.amount;
      });
      
      res.json({
        balances: userWallets,
        pending: pendingByCurrency
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get balances" });
    }
  });

  // ============ ORDERS ============

  // Create an order
  app.post("/api/orders", async (req, res) => {
    try {
      const { userId, type, productId, productName, amount, currency, metadata, paymentMethod } = req.body;
      const { orders, wallets, notifications } = await import("@shared/schema");
      
      if (!userId || !type || !productName || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check balance if paying from balance
      if (paymentMethod === "balance") {
        const userWallets = await db.select()
          .from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.symbol, currency || "USDT")));
        
        if (userWallets.length === 0 || userWallets[0].balance < amount) {
          return res.status(400).json({ 
            error: "Insufficient balance",
            required: amount,
            available: userWallets[0]?.balance || 0
          });
        }

        // Deduct balance
        await db.update(wallets)
          .set({ balance: userWallets[0].balance - amount })
          .where(eq(wallets.id, userWallets[0].id));
      }

      // Create order
      const [order] = await db.insert(orders).values({
        userId,
        type,
        productId,
        productName,
        amount,
        currency: currency || "USDT",
        metadata,
        paymentMethod: paymentMethod || "balance",
        balanceDeducted: paymentMethod === "balance",
        status: "completed", // Immediate completion for balance payments
        completedAt: paymentMethod === "balance" ? new Date() : null,
      }).returning();

      // Create notification
      await db.insert(notifications).values({
        userId,
        type: "order",
        category: "user",
        title: "Order Completed",
        message: `Your purchase of ${productName} for $${amount} ${currency || "USDT"} was successful!`,
        priority: "normal",
        data: { orderId: order.id, amount, productName },
      });

      res.json({ 
        success: true, 
        order,
        message: "Order completed successfully!"
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get user's orders
  app.get("/api/orders/:userId", async (req, res) => {
    try {
      const { orders } = await import("@shared/schema");
      const userOrders = await db.select()
        .from(orders)
        .where(eq(orders.userId, req.params.userId))
        .orderBy(desc(orders.createdAt));
      
      res.json(userOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  // ============ GLOBAL NOTIFICATIONS ============

  // Get global/broadcast notifications (for all users) - shows announcements from database
  app.get("/api/notifications/global/all", async (_req, res) => {
    try {
      const { notifications } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      
      // Get notifications where userId is null (broadcast to all)
      const globalNotifications = await db.select()
        .from(notifications)
        .where(sql`${notifications.userId} IS NULL`)
        .orderBy(desc(notifications.createdAt))
        .limit(20);
      
      res.json(globalNotifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get global notifications" });
    }
  });

  return httpServer;
}
