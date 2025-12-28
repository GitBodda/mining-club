import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  users, depositAddresses, ledgerEntries, withdrawalRequests, 
  adminActions, networkConfig, blockchainDeposits, interestPayments 
} from "@shared/schema";
import { blockchainService } from "./services/blockchain";
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
      res.json({ balances, totalBalance, change24h: 2.15 });
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

      // Generate address from HD wallet
      const address = blockchainService.deriveDepositAddress(nextIndex);
      
      if (!address) {
        return res.status(500).json({ error: "HD wallet not initialized" });
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

  return httpServer;
}
