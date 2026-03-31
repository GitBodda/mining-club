import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  users, depositAddresses, ledgerEntries, withdrawalRequests, 
  adminActions, networkConfig, blockchainDeposits, interestPayments,
  miningPurchases, notifications, wallets, depositRequests
} from "@shared/schema";
import { blockchainService } from "./services/blockchain";
import { walletService } from "./services/walletService";
import { getMasterWalletService } from "./services/hdWalletService";
import { authService } from "./services/authService";
import * as stripeService from "./services/stripeService";
import { eq, and, or, desc, lte, inArray, sql } from "drizzle-orm";
import { generateSecret, generate, verify } from "otplib";
import QRCode from "qrcode";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const resolveDbUserId = async (idOrFirebaseUid: string | undefined | null): Promise<string | null> => {
    if (!idOrFirebaseUid) return null;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.id, idOrFirebaseUid), eq(users.firebaseUid, idOrFirebaseUid)))
      .limit(1);

    return user?.id || null;
  };

  const toFiniteNumber = (value: unknown): number | null => {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  };
  
  // Mining Stats
  app.get("/api/mining/stats", async (_req, res) => {
    try {
      const stats = await storage.getMiningStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mining stats" });
    }
  });

  // BTC Price Proxy
  app.get("/api/prices/btc", async (_req, res) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { 
          signal: controller.signal,
          headers: { "Accept": "application/json" }
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to fetch from Coingecko");
      }

      const data = await response.json() as any;
      const price = Number(data?.bitcoin?.usd);
      
      if (Number.isFinite(price) && price > 0) {
        res.json({ price });
      } else {
        throw new Error("Invalid price data");
      }
    } catch (error) {
      console.error("Price fetch error:", error);
      res.status(500).json({ error: "Failed to fetch price" });
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

  // Mining contracts endpoint - returns user's active mining contracts
  app.get("/api/mining/contracts", async (req, res) => {
    try {
      // For now, return empty array - will be populated when user purchases contracts
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mining contracts" });
    }
  });

  // Mining pool status endpoint - returns current pool connection status
  app.get("/api/mining/pool-status", async (req, res) => {
    try {
      const stats = await storage.getMiningStats();
      res.json({
        connected: stats.isActive,
        poolName: stats.poolName || "CryptoPool Pro",
        hashRate: `${stats.hashRate} ${stats.hashRateUnit}`,
        uptime: 99.98,
        workers: stats.isActive ? 1 : 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get pool status" });
    }
  });

  // Wallet
  app.get("/api/wallet/balances", async (req, res) => {
    try {
      let userId = res.locals.user?.id;
      
      // If not in locals, check header
      if (!userId) {
         const authHeader = req.headers.authorization;
         if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const payload = await authService.verifyToken(token);
            if (payload) {
               const user = await db.query.users.findFirst({
                 where: eq(users.firebaseUid, payload.uid)
               });
               userId = user?.id;
            }
         }
      }

      if (!userId) {
         // Fallback for dev/mock without auth? No, assume auth required for sync.
         return res.status(401).json({ error: "Unauthorized" });
      }

      const userWallets = await walletService.getUserWallets(userId);
      
      const prices: Record<string, number> = {
        BTC: 98500, LTC: 125, ETH: 3450, USDT: 1, USDC: 1, TON: 5.2
      };

      const balances = userWallets.map(w => ({
        symbol: w.symbol,
        balance: w.balance,
        usdValue: w.balance * (prices[w.symbol] || 0),
        address: w.address
      }));

      const totalBalance = balances.reduce((sum, b) => sum + b.usdValue, 0);
      const change24h = 0; 

      res.json({ balances, totalBalance, change24h });
    } catch (error) {
      console.error("Failed to get wallet balances:", error);
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
      const resolvedUserId = await resolveDbUserId(req.params.userId);
      if (!resolvedUserId) return res.status(404).json({ error: "User not found" });
      
      const addresses = await db.select()
        .from(depositAddresses)
        .where(eq(depositAddresses.userId, resolvedUserId));
      
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
      
      console.log("Withdrawal request received:", { userId, symbol, network, amount, toAddress });
      
      if (!userId || !symbol || !network || !amount || !toAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Basic address validation - just check it's not empty and has reasonable length
      if (toAddress.trim().length < 10 || toAddress.trim().length > 100) {
        return res.status(400).json({ error: "Invalid withdrawal address format" });
      }

      // Get current balance from wallets table (case-insensitive symbol matching)
      // Fetch all wallets for this user and symbol (case-insensitive)
      const allUserWallets = await db.select()
        .from(wallets)
        .where(eq(wallets.userId, userId));

      // Filter by symbol case-insensitively and find wallet with highest balance
      const matchingWallets = allUserWallets.filter(w => 
        w.symbol.toUpperCase() === symbol.toUpperCase()
      );

      // Use the wallet with the highest balance (in case of duplicates)
      const userWallet = matchingWallets.length > 0 
        ? matchingWallets.reduce((max, w) => w.balance > max.balance ? w : max)
        : null;

      const currentBalance = userWallet ? (userWallet.balance || 0) : 0;
      const actualSymbol = userWallet ? userWallet.symbol : symbol;

      console.log("Current balance:", currentBalance, "Symbol:", actualSymbol, "Matches found:", matchingWallets.length);

      // Get network config for fee (or use default)
      const networkCfg = await db.select()
        .from(networkConfig)
        .where(eq(networkConfig.network, network))
        .limit(1);

      const fee = networkCfg.length > 0 ? networkCfg[0].withdrawalFee : 0.0001;
      const minWithdrawal = networkCfg.length > 0 ? networkCfg[0].minWithdrawal : 0.001;

      if (amount < minWithdrawal) {
        return res.status(400).json({ 
          error: `Minimum withdrawal is ${minWithdrawal} ${symbol}` 
        });
      }

      // Check if user has enough balance (including fee)
      if (currentBalance < amount) {
        return res.status(400).json({ 
          error: "Insufficient balance",
          balance: currentBalance,
          required: amount
        });
      }

      const netAmount = amount - fee;

      // Create withdrawal request
      const [request] = await db.insert(withdrawalRequests).values({
        userId,
        symbol: actualSymbol,
        network,
        amount,
        fee,
        netAmount,
        toAddress,
        status: "pending",
      }).returning();

      console.log("Withdrawal request created:", request.id);

      // Send notification to user
      await db.insert(notifications).values({
        userId,
        type: "withdrawal",
        category: "user",
        title: "Withdrawal Request Submitted",
        message: `Your withdrawal request for ${amount} ${actualSymbol} has been submitted and is pending admin approval.`,
        data: { requestId: request.id, amount, symbol: actualSymbol, network, toAddress },
        priority: "normal",
      }).catch(err => console.error("Failed to create notification:", err));

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
      const resolvedUserId = await resolveDbUserId(req.params.userId);
      if (!resolvedUserId) return res.status(404).json({ error: "User not found" });
      
      const withdrawals = await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, resolvedUserId))
        .orderBy(desc(withdrawalRequests.requestedAt));
      
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get withdrawal history" });
    }
  });

  // Get user's recent activity (deposits, withdrawals, earnings, and daily rewards)
  app.get("/api/wallet/activity/:userId", async (req, res) => {
    try {
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) return res.status(404).json({ error: "User not found" });
      
      // Get deposits
      const deposits = await db.select()
        .from(depositRequests)
        .where(eq(depositRequests.userId, userId))
        .orderBy(desc(depositRequests.createdAt))
        .limit(10);

      // Get withdrawals
      const withdrawals = await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, userId))
        .orderBy(desc(withdrawalRequests.requestedAt))
        .limit(10);

      // Get recent earnings from ledger (mining rewards, yield returns)
      const earnings = await db.select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.userId, userId))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(20);

      // Get active mining purchases to generate virtual daily rewards
      const activePurchases = await db.select()
        .from(miningPurchases)
        .where(and(
          eq(miningPurchases.userId, userId),
          eq(miningPurchases.status, "active")
        ));

      // Generate virtual daily reward entries for each active purchase
      // These show what users are earning daily even if ledger entries haven't been created yet
      const virtualDailyRewards = activePurchases.map((purchase, index) => {
        const returnPercent = purchase.returnPercent || 0;
        const paybackDays = (purchase.paybackMonths || 60) * 30; // Convert months to days, 5 years default
        const dailyReturnUSD = (purchase.amount * returnPercent / 100) / paybackDays;
        
        return {
          id: `daily-reward-${purchase.id}-${index}`,
          type: 'earned' as const,
          amount: parseFloat(dailyReturnUSD.toFixed(2)),
          symbol: 'USDT',
          currency: 'USDT',
          status: 'completed',
          createdAt: new Date(), // Today
          description: `Daily Yield - ${purchase.packageName || 'Mining'}`,
        };
      });

      // Combine and format
      const activity = [
        ...deposits.map(d => ({
          id: d.id,
          type: 'deposit' as const,
          amount: d.amount,
          symbol: d.currency,
          currency: d.currency,
          status: d.status,
          createdAt: d.createdAt,
          network: d.network,
        })),
        ...withdrawals.map(w => ({
          id: w.id,
          type: 'withdrawal' as const,
          amount: w.amount,
          symbol: w.symbol,
          currency: w.symbol,
          status: w.status,
          createdAt: w.requestedAt,
          network: w.network,
        })),
        // Include positive ledger entries as "earned" type (mining rewards, yield)
        ...earnings
          .filter(e => e.amount > 0 && e.type !== 'purchase') // Only positive amounts (earnings), not purchases
          .map(e => ({
            id: e.id,
            type: 'earned' as const,
            amount: e.amount,
            symbol: e.symbol,
            currency: e.symbol,
            status: 'completed',
            createdAt: e.createdAt || new Date(),
            description: e.note || 'Daily Reward',
          })),
        // Add virtual daily rewards from active mining purchases
        ...virtualDailyRewards
      ].sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())
        .slice(0, 15);

      res.json(activity);
    } catch (error) {
      console.error("Failed to get activity:", error);
      res.status(500).json({ error: "Failed to get activity" });
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

  // Get user purchases/orders (admin view)
  app.get("/api/admin/users/:userId/purchases", async (req, res) => {
    try {
      const { userId } = req.params;
      const { orders, miningPurchases, earnSubscriptions } = await import("@shared/schema");

      // Auto-complete expired mining purchases for accurate admin view
      await db
        .update(miningPurchases)
        .set({ status: "completed" })
        .where(and(eq(miningPurchases.userId, userId), eq(miningPurchases.status, "active"), lte(miningPurchases.expiryDate, new Date())))
        .catch(() => {});
      
      // Get all orders for this user
      const userOrders = await db.select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

      // Fetch associated mining purchases and earn subscriptions
      const miningData = await db.select()
        .from(miningPurchases)
        .where(eq(miningPurchases.userId, userId));

      const earnData = await db.select()
        .from(earnSubscriptions)
        .where(eq(earnSubscriptions.userId, userId));

      // Combine data
      const enrichedOrders = userOrders.map(order => {
        let details = {};
        
        if (order.type === "mining_purchase") {
          const mining = miningData.find(m => m.id === order.productId);
          if (mining) {
            details = {
              packageName: mining.packageName,
              crypto: mining.crypto,
              symbol: order.currency,
              hashrate: mining.hashrate,
              hashrateUnit: mining.hashrateUnit,
              status: mining.status,
              totalEarned: mining.totalEarned,
              purchaseDate: mining.purchaseDate,
              expiryDate: mining.expiryDate,
            };
          }
        } else if (order.type === "earn_subscription") {
          const earn = earnData.find(e => e.id === order.productId);
          if (earn) {
            details = {
              planId: earn.planId,
              symbol: earn.symbol,
              durationType: earn.durationType,
              aprRate: earn.aprRate,
              status: earn.status,
              totalEarned: earn.totalEarned,
              startDate: earn.startDate,
              endDate: earn.endDate,
            };
          }
        }

        return {
          ...order,
          details
        };
      });

      res.json({ orders: enrichedOrders });
    } catch (error) {
      console.error("Error getting user purchases:", error);
      res.status(500).json({ error: "Failed to get user purchases" });
    }
  });

  // Admin: Terminate a mining purchase (mark completed)
  app.post("/api/admin/mining-purchases/:purchaseId/terminate", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { reason } = (req.body || {}) as { reason?: string };

      const { miningPurchases } = await import("@shared/schema");

      const [purchase] = await db.select().from(miningPurchases).where(eq(miningPurchases.id, purchaseId));
      if (!purchase) return res.status(404).json({ error: "Purchase not found" });

      const [updated] = await db
        .update(miningPurchases)
        .set({ status: "completed", expiryDate: purchase.expiryDate || new Date() })
        .where(eq(miningPurchases.id, purchaseId))
        .returning();

      await db
        .insert(notifications)
        .values({
          userId: purchase.userId,
          type: "purchase",
          category: "user",
          title: "Mining Contract Ended",
          message: reason ? `Your mining contract was ended by admin: ${reason}` : "Your mining contract has ended.",
          priority: "normal",
          data: { purchaseId },
        })
        .catch(() => {});

      await db
        .insert(adminActions)
        .values({
          adminId: "system",
          targetUserId: purchase.userId,
          actionType: "terminate_mining_purchase",
          details: { purchaseId, reason: reason || null },
        })
        .catch(() => {});

      res.json({ success: true, purchase: updated });
    } catch (error) {
      console.error("Error terminating mining purchase:", error);
      res.status(500).json({ error: "Failed to terminate purchase" });
    }
  });

  // Admin: Get all solo mining purchases
  app.get("/api/admin/solo-mining-purchases", async (req, res) => {
    try {
      const { miningPurchases, users } = await import("@shared/schema");
      
      // Get all solo mining purchases (packageName contains "Solo Mining")
      const purchases = await db.select({
        id: miningPurchases.id,
        userId: miningPurchases.userId,
        packageName: miningPurchases.packageName,
        amount: miningPurchases.amount,
        hashrate: miningPurchases.hashrate,
        hashrateUnit: miningPurchases.hashrateUnit,
        status: miningPurchases.status,
        totalEarned: miningPurchases.totalEarned,
        purchaseDate: miningPurchases.purchaseDate,
        expiryDate: miningPurchases.expiryDate,
        userEmail: users.email,
        userDisplayName: users.displayName,
      })
        .from(miningPurchases)
        .leftJoin(users, eq(miningPurchases.userId, users.id))
        .where(sql`${miningPurchases.packageName} LIKE '%Solo Mining%'`)
        .orderBy(desc(miningPurchases.purchaseDate));
      
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching solo mining purchases:", error);
      res.status(500).json({ error: "Failed to fetch solo mining purchases" });
    }
  });

  // Admin: Award block to solo miner
  app.post("/api/admin/solo-mining/:purchaseId/award-block", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { blockReward = 3.125, txHash } = req.body as { blockReward?: number; txHash?: string };
      
      const { miningPurchases, wallets } = await import("@shared/schema");
      
      // Get the purchase
      const [purchase] = await db.select().from(miningPurchases).where(eq(miningPurchases.id, purchaseId));
      if (!purchase) return res.status(404).json({ error: "Purchase not found" });
      
      // Find or create BTC wallet for user
      let [btcWallet] = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, purchase.userId), sql`UPPER(${wallets.symbol}) = 'BTC'`));
      
      if (!btcWallet) {
        [btcWallet] = await db.insert(wallets).values({
          userId: purchase.userId,
          symbol: "BTC",
          name: "Bitcoin",
          balance: 0,
        }).returning();
      }
      
      // Add block reward to BTC wallet
      await db.update(wallets)
        .set({ balance: (btcWallet.balance || 0) + blockReward })
        .where(eq(wallets.id, btcWallet.id));
      
      // Update totalEarned on the purchase
      await db.update(miningPurchases)
        .set({ totalEarned: (purchase.totalEarned || 0) + blockReward })
        .where(eq(miningPurchases.id, purchaseId));
      
      // Create celebratory notification
      await db.insert(notifications).values({
        userId: purchase.userId,
        type: "deposit",
        category: "user",
        title: "🎉 BLOCK FOUND! You Won Bitcoin!",
        message: `Congratulations! Your solo mining operation found a block! ${blockReward} BTC has been deposited to your wallet.${txHash ? ` TX: ${txHash}` : ""}`,
        priority: "high",
        data: { 
          type: "block_reward",
          amount: blockReward,
          currency: "BTC",
          purchaseId,
          txHash: txHash || null,
        },
      });
      
      // Log admin action
      await db.insert(adminActions).values({
        adminId: "system",
        targetUserId: purchase.userId,
        actionType: "award_block",
        details: { purchaseId, blockReward, txHash: txHash || null },
      }).catch(() => {});
      
      res.json({ 
        success: true, 
        message: `Awarded ${blockReward} BTC to user`,
        newBalance: (btcWallet.balance || 0) + blockReward,
      });
    } catch (error) {
      console.error("Error awarding block:", error);
      res.status(500).json({ error: "Failed to award block" });
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
        // Deduct from user's wallet balance
        const userWalletList = await db.select()
          .from(wallets)
          .where(
            and(
              eq(wallets.userId, request.userId),
              sql`UPPER(${wallets.symbol}) = UPPER(${request.symbol})`
            )
          );

        if (userWalletList.length === 0) {
          return res.status(400).json({ error: "Wallet not found" });
        }

        // Find wallet with highest balance
        const userWallet = userWalletList.reduce((max, w) => w.balance > max.balance ? w : max);
        const balanceBefore = userWallet.balance;
        const balanceAfter = balanceBefore - request.amount;

        if (balanceAfter < 0) {
          return res.status(400).json({ error: "Insufficient balance" });
        }

        // Update wallet balance
        await db.update(wallets)
          .set({ balance: balanceAfter })
          .where(eq(wallets.id, userWallet.id));

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

        // Send approval notification to user
        await db.insert(notifications).values({
          userId: request.userId,
          type: "withdrawal",
          category: "user",
          title: "Withdrawal Approved",
          message: `Your withdrawal of ${request.amount} ${request.symbol} has been approved and processed.${txHash ? ` Transaction: ${txHash}` : ''}`,
          data: { requestId: id, amount: request.amount, symbol: request.symbol, txHash, status: "completed" },
          priority: "high",
        }).catch(err => console.error("Failed to create notification:", err));

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

        // Send rejection notification to user
        await db.insert(notifications).values({
          userId: request.userId,
          type: "withdrawal",
          category: "user",
          title: "Withdrawal Rejected",
          message: `Your withdrawal of ${request.amount} ${request.symbol} has been rejected.${note ? ` Reason: ${note}` : ''}`,
          data: { requestId: id, amount: request.amount, symbol: request.symbol, reason: note, status: "rejected" },
          priority: "high",
        }).catch(err => console.error("Failed to create notification:", err));
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

  // Admin: Delete wallet (for removing duplicates)
  app.delete("/api/admin/wallets/:walletId", async (req, res) => {
    try {
      const { walletId } = req.params;
      
      await db.delete(wallets)
        .where(eq(wallets.id, walletId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete wallet error:", error);
      res.status(500).json({ error: "Failed to delete wallet" });
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

      // Resolve userId - could be Firebase UID or database ID
      const resolvedUserId = await resolveDbUserId(userId);
      if (!resolvedUserId) {
        return res.json({ notifications: [], unreadCount: 0 });
      }

      const { notificationService } = await import("./services/notificationService");
      const notifications = await notificationService.getUserNotifications(resolvedUserId, limit, includeRead);
      const unreadCount = await notificationService.getUnreadCount(resolvedUserId);

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
      // Resolve userId - could be Firebase UID or database ID
      const resolvedUserId = await resolveDbUserId(userId);
      if (!resolvedUserId) {
        return res.status(404).json({ error: "User not found" });
      }
      const { notificationService } = await import("./services/notificationService");
      await notificationService.markAllAsRead(resolvedUserId);
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

  // Save FCM token for push notifications
  app.post("/api/users/:userId/fcm-token", async (req, res) => {
    try {
      const { userId } = req.params;
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ error: "FCM token is required" });
      }

      // Store FCM token in notification preferences (pushNotifications field repurposed or create new)
      const { notificationPreferences } = await import("@shared/schema");
      
      // Upsert notification preferences with pushToken stored
      const existing = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      if (existing.length > 0) {
        await db.update(notificationPreferences)
          .set({ pushNotifications: true, updatedAt: new Date() })
          .where(eq(notificationPreferences.userId, userId));
      } else {
        await db.insert(notificationPreferences).values({
          userId,
          pushNotifications: true,
        });
      }

      // Also log the token for admin/debugging
      console.log(`FCM token received for user ${userId}: ${fcmToken.substring(0, 20)}...`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save FCM token:", error);
      res.status(500).json({ error: "Failed to save FCM token" });
    }
  });

  // =====================================================
  // AUTO-WITHDRAWAL SETTINGS
  // =====================================================

  // Get auto-withdrawal settings
  app.get("/api/users/:userId/auto-withdraw", async (req, res) => {
    try {
      const { autoWithdrawSettings } = await import("@shared/schema");
      const resolvedUserId = await resolveDbUserId(req.params.userId);
      if (!resolvedUserId) return res.status(404).json({ error: "User not found" });

      const [settings] = await db.select()
        .from(autoWithdrawSettings)
        .where(eq(autoWithdrawSettings.userId, resolvedUserId));

      if (!settings) {
        // Return default settings if none exist
        return res.json({
          enabled: false,
          currency: "USDT",
          network: "trc20",
          walletAddress: "",
          period: "monthly",
          minAmount: 10,
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error getting auto-withdraw settings:", error);
      res.status(500).json({ error: "Failed to get auto-withdraw settings" });
    }
  });

  // Update auto-withdrawal settings
  app.patch("/api/users/:userId/auto-withdraw", async (req, res) => {
    try {
      const { autoWithdrawSettings } = await import("@shared/schema");
      const resolvedUserId = await resolveDbUserId(req.params.userId);
      if (!resolvedUserId) return res.status(404).json({ error: "User not found" });

      const { enabled, currency, network, walletAddress, period, minAmount } = req.body;

      // Check if settings exist
      const [existing] = await db.select()
        .from(autoWithdrawSettings)
        .where(eq(autoWithdrawSettings.userId, resolvedUserId));

      if (existing) {
        // Update existing
        const [updated] = await db.update(autoWithdrawSettings)
          .set({
            enabled,
            currency,
            network,
            walletAddress,
            period,
            minAmount,
            updatedAt: new Date(),
          })
          .where(eq(autoWithdrawSettings.userId, resolvedUserId))
          .returning();
        res.json(updated);
      } else {
        // Create new
        const [created] = await db.insert(autoWithdrawSettings)
          .values({
            userId: resolvedUserId,
            enabled,
            currency,
            network,
            walletAddress,
            period,
            minAmount,
          })
          .returning();
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating auto-withdraw settings:", error);
      res.status(500).json({ error: "Failed to update auto-withdraw settings" });
    }
  });

  // =====================================================
  // EARN/YIELD PLANS (Public Routes)
  // =====================================================

  // Get active earn plans
  app.get("/api/earn-plans", async (_req, res) => {
    try {
      const { earnPlans } = await import("@shared/schema");
      // Ensure at least a USDT plan exists so the Invest page can always subscribe.
      const existingUsdt = await db
        .select()
        .from(earnPlans)
        .where(eq(earnPlans.symbol, "USDT"));

      if (existingUsdt.length === 0) {
        await db
          .insert(earnPlans)
          .values({
            symbol: "USDT",
            name: "Tether",
            icon: "₮",
            colorPrimary: "#10b981",
            colorSecondary: "#22c55e",
            minAmount: 100,
            dailyApr: 19,
            weeklyApr: 19,
            monthlyApr: 19,
            quarterlyApr: 19,
            yearlyApr: 19,
            isActive: true,
            order: 0,
          })
          .onConflictDoNothing();
      }

      const plans = await db.select()
        .from(earnPlans)
        .where(eq(earnPlans.isActive, true))
        .orderBy(earnPlans.order);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to get earn plans" });
    }
  });

  // Public UI estimates config (safe allowlist)
  app.get("/api/config/estimates", async (_req, res) => {
    try {
      const { appConfig } = await import("@shared/schema");
      const keys = [
        "public_invest_apr_annual_percent",
        "public_mining_estimate_multiplier",
        "public_solo_estimate_multiplier",
      ];

      const rows = await db
        .select()
        .from(appConfig)
        .where(inArray(appConfig.key, keys));

      const map = new Map(rows.map((r) => [r.key, r.value]));

      const investApr = Number(map.get("public_invest_apr_annual_percent") ?? "19");
      const miningMultiplier = Number(map.get("public_mining_estimate_multiplier") ?? "1");
      const soloMultiplier = Number(map.get("public_solo_estimate_multiplier") ?? "1");

      res.json({
        investAprAnnualPercent: Number.isFinite(investApr) ? investApr : 19,
        miningEstimateMultiplier: Number.isFinite(miningMultiplier) ? miningMultiplier : 1,
        soloEstimateMultiplier: Number.isFinite(soloMultiplier) ? soloMultiplier : 1,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get estimates config" });
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

      const resolvedUserId = await resolveDbUserId(userId);
      const numericAmount = toFiniteNumber(amount);
      const purchaseSymbol = (symbol || "USDT") as string;

      if (!resolvedUserId || !planId || numericAmount === null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (numericAmount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }
      
      // Check user has sufficient balance
      const userWallets = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, resolvedUserId), eq(wallets.symbol, purchaseSymbol)));
      
      if (userWallets.length === 0 || userWallets[0].balance < numericAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct from wallet
      await db.update(wallets)
        .set({ balance: userWallets[0].balance - numericAmount })
        .where(eq(wallets.id, userWallets[0].id));

      // Create subscription
      const subscription = await db.insert(earnSubscriptions).values({
        userId: resolvedUserId,
        planId,
        amount: numericAmount,
        symbol: purchaseSymbol,
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
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
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
        symbol,
        amount, 
        hashrate, 
        hashrateUnit, 
        efficiency,
        dailyReturnBTC, 
        returnPercent,
        paybackMonths,
        expiryDate
      } = req.body;
      const { miningPurchases, wallets, orders, notifications } = await import("@shared/schema");

      const resolvedUserId = await resolveDbUserId(userId);
      const numericAmount = toFiniteNumber(amount);
      
      const purchaseCurrency = (symbol || "USDT") as string;

      if (!resolvedUserId || !packageName || numericAmount === null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (numericAmount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }
      
      // Check user has sufficient balance in selected currency
      const userWallets = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, resolvedUserId), eq(wallets.symbol, purchaseCurrency)));
      
      if (userWallets.length === 0 || userWallets[0].balance < numericAmount) {
        return res.status(400).json({ error: `Insufficient ${purchaseCurrency} balance` });
      }

      // Deduct from wallet
      await db.update(wallets)
        .set({ balance: userWallets[0].balance - numericAmount })
        .where(eq(wallets.id, userWallets[0].id));

      // Create mining purchase
      const purchase = await db.insert(miningPurchases).values({
        userId: resolvedUserId,
        packageName,
        crypto,
        amount: numericAmount,
        hashrate,
        hashrateUnit,
        efficiency,
        dailyReturnBTC,
        returnPercent,
        paybackMonths,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: "active",
      }).returning();

      // Create order record for tracking
      await db.insert(orders).values({
        userId: resolvedUserId,
        type: "mining_purchase",
        productId: purchase[0].id,
        productName: `${crypto} Mining - ${packageName} (${hashrate} ${hashrateUnit})`,
        amount: numericAmount,
        currency: purchaseCurrency,
        paymentMethod: "balance",
        balanceDeducted: true,
        status: "completed",
        completedAt: new Date(),
        metadata: { crypto, hashrate, hashrateUnit, efficiency, dailyReturnBTC, returnPercent, paybackMonths },
      });

      // Create notification
      await db.insert(notifications).values({
        userId: resolvedUserId,
        type: "purchase",
        category: "user",
        title: "Mining Package Activated!",
        message: `Your ${packageName} ${crypto} mining package (${hashrate} ${hashrateUnit}) purchased with ${purchaseCurrency} is now active and earning rewards.`,
        priority: "normal",
        data: { purchaseId: purchase[0].id, packageName, crypto, hashrate, symbol: purchaseCurrency },
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
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const { miningPurchases } = await import("@shared/schema");

      // Auto-complete expired purchases so clients stop counting them as active
      await db
        .update(miningPurchases)
        .set({ status: "completed" })
        .where(and(eq(miningPurchases.userId, userId), eq(miningPurchases.status, "active"), lte(miningPurchases.expiryDate, new Date())))
        .catch(() => {});
      
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
      
      res.json({
        map: walletMap,
        entries: wallets.map((w) => ({
          id: w.id,
          key: w.key,
          value: w.value,
          description: w.description,
          category: w.category,
          isActive: w.isActive,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallet addresses" });
    }
  });

  // Diagnostic endpoint to check Firebase Admin SDK status
  app.get("/api/auth/status", async (_req, res) => {
    try {
      const { getAdminAuth } = await import("./firebase-admin");
      const adminAuth = getAdminAuth();
      res.json({
        firebaseAdminInitialized: !!adminAuth,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || "not set",
        serviceAccountConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        databaseConnected: !!db,
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error",
        firebaseAdminInitialized: false 
      });
    }
  });

  // ── Google Sign-In via Browser (iOS Capacitor) ──────────────────────────────
  // Sessions are short-lived (5 min).  Keys are random; values are single-use.
  const googleAuthSessions = new Map<string, { customToken: string; ts: number }>();
  const GOOGLE_SESSION_TTL = 5 * 60 * 1000;

  // Cleanup stale sessions periodically (runs every 5 min)
  setInterval(() => {
    const now = Date.now();
    googleAuthSessions.forEach((v, k) => {
      if (now - v.ts > GOOGLE_SESSION_TTL) googleAuthSessions.delete(k);
    });
  }, GOOGLE_SESSION_TTL);

  // ─── Google OAuth pending map  (app-sid → Firebase sessionId) ───────────────
  const googleOAuthPending = new Map<string, { firebaseSessionId: string; ts: number }>();
  const OAUTH_PENDING_TTL = 10 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    googleOAuthPending.forEach((v, k) => {
      if (now - v.ts > OAUTH_PENDING_TTL) googleOAuthPending.delete(k);
    });
  }, OAUTH_PENDING_TTL);

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /google-auth
  //
  // Root cause of the old white-page bug:
  //   • `signInWithRedirect` stores state in indexedDB/localStorage.
  //   • iOS 17+ ITP can clear that storage during the cross-origin redirect chain
  //     (hardisk.co → accounts.google.com → firebaseapp.com → hardisk.co).
  //   • Firebase's `getRedirectResult` returns null → page re-triggers the redirect
  //     → infinite loop / blank page.
  //
  // New approach — zero Firebase SDK in the browser, zero client-side state:
  //   1. Case A (?sid=…)  → server calls Firebase's createAuthUri REST API to get a
  //      real Google OAuth URL, stores the Firebase sessionId server-side, sets a
  //      short-lived cookie, and 302-redirects the browser straight to Google.
  //   2. Case B (callback) → Google redirects back to /google-auth with the
  //      id_token in the URL *fragment* (#id_token=…).  Fragments aren't sent to
  //      the server, so we serve a minimal HTML page whose JS reads the token and
  //      POSTs it to /api/auth/google/exchange.
  // ─────────────────────────────────────────────────────────────────────────────
  const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAcLEpB_6dwpdEmvhal69TZy6lI_dracaE';
  const GOOGLE_AUTH_CALLBACK = 'https://hardisk.co/google-auth';

  app.get("/google-auth", async (req: any, res: any) => {
    const appSid = (req.query.sid as string) || null;

    // ── Case A: fresh request from the iOS app ──────────────────────────────
    if (appSid) {
      try {
        const createAuthRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerId: 'google.com', continueUri: GOOGLE_AUTH_CALLBACK }),
          }
        );
        const createAuthData: any = await createAuthRes.json();
        if (!createAuthData.authUri) throw new Error('Firebase createAuthUri returned no authUri');

        // Store both mappings: appSid → firebaseSessionId, and firebaseSessionId → appSid
        googleOAuthPending.set(appSid, { firebaseSessionId: createAuthData.sessionId, ts: Date.now() });
        googleOAuthPending.set(`fb_${createAuthData.sessionId}`, { firebaseSessionId: appSid, ts: Date.now() });

        return res.redirect(302, createAuthData.authUri);
      } catch (err) {
        console.error('[google-auth] initiation error:', err);
        return res.status(500).type('html').send(
          `<p style="font-family:sans-serif;color:#f87171;padding:2rem">
           Sign-in setup failed:<br>${err instanceof Error ? err.message : String(err)}<br>
           Please go back to the app and try again.</p>`
        );
      }
    }

    // ── Case B: callback from Google  (id_token in URL hash, not visible to server) ──
    const callbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Completing sign-in…</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Outfit:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Outfit',sans-serif;background:#0a0a0f;color:#fff;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem}
    .card{text-align:center;max-width:340px;width:100%}
    .logo{font-size:2.5rem;margin-bottom:1rem}
    h2{font-family:'Space Grotesk',sans-serif;font-size:1.25rem;font-weight:700;margin-bottom:.5rem}
    p{color:rgba(255,255,255,.55);font-size:.875rem;line-height:1.5}
    .spin{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:#10b981;
          border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 1.2rem}
    @keyframes spin{to{transform:rotate(360deg)}}
    .err{color:#f87171!important}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">₿</div>
  <div class="spin" id="spin"></div>
  <h2 id="title">Completing sign-in…</h2>
  <p id="sub">Please wait</p>
</div>
<script>
  function ui(title, sub, isErr) {
    document.getElementById('title').textContent = title;
    var subEl = document.getElementById('sub');
    subEl.textContent = sub || '';
    if (isErr) {
      document.getElementById('spin').style.display = 'none';
      subEl.className = 'err';
    }
  }
  (async function () {
    try {
      var hash = new URLSearchParams(location.hash.slice(1));
      var idToken = hash.get('id_token');
      if (!idToken) {
        ui('Nothing to complete', 'Please start sign-in from the app.', true);
        return;
      }
      ui('Almost done\u2026', 'Securing your account');
      var r = await fetch('/api/auth/google/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idToken })
      });
      var data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || 'Exchange failed');
      ui('\u2713 Signed in!', 'Returning to app\u2026');
      setTimeout(function () { location.href = '/auth-complete'; }, 500);
    } catch (e) {
      ui('Sign-in failed', (e && e.message) ? e.message : 'Please go back and try again.', true);
    }
  })();
</script>
</body>
</html>`;
    res.type("html").send(callbackHtml);
  });

  // Simple "done" page — tries to close system browser and return to app
  app.get("/auth-complete", (_req, res) => {
    res.type("html").send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Done</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Outfit:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:#0a0a0f;color:#fff;
display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:1.5rem}
.card{max-width:340px;width:100%}
.icon{font-size:3rem;margin-bottom:1rem}
h2{font-family:'Space Grotesk',sans-serif;color:#10b981;font-size:1.5rem;font-weight:700;margin-bottom:.5rem}
p{color:rgba(255,255,255,.55);font-size:.875rem;line-height:1.5}
.spin{width:36px;height:36px;border:3px solid rgba(255,255,255,.1);border-top-color:#10b981;
border-radius:50%;animation:spin .8s linear infinite;margin:1rem auto 0}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
  <div class="icon">\u20bf</div>
  <h2>\u2713 Signed in!</h2>
  <p id="msg">Returning to app\u2026</p>
  <div class="spin" id="spin"></div>
</div>
<script>
(function(){
  // Try to close the browser tab (works for system browser opened by Capacitor)
  try { window.close(); } catch(e) {}
  // If still here after 1.5s, show manual message (NEVER redirect to the website)
  setTimeout(function(){
    document.getElementById('spin').style.display='none';
    document.getElementById('msg').textContent='You can now return to the app.';
  }, 1500);
})();
</script></body></html>`);
  });

  // Exchange Google id_token (from URL hash) → Firebase custom token
  app.post("/api/auth/google/exchange", async (req: any, res: any) => {
    const { idToken: googleIdToken, state: oauthState } = req.body || {};
    if (!googleIdToken) return res.status(400).json({ error: 'Missing idToken' });

    // Find the pending session using the OAuth state to reverse-lookup the appSid
    let appSid: string | null = null;
    let pending: { firebaseSessionId: string; ts: number } | null = null;

    const entries = Array.from(googleOAuthPending.entries());
    for (const [key, val] of entries) {
      if (key.startsWith('fb_') || key.startsWith('apple_')) continue;
      if (Date.now() - val.ts < OAUTH_PENDING_TTL) {
        appSid = key;
        pending = val;
        break;
      }
    }

    if (!appSid || !pending) {
      return res.status(400).json({ error: 'Auth session expired or not found — please try again' });
    }
    googleOAuthPending.delete(appSid);
    googleOAuthPending.delete(`fb_${pending.firebaseSessionId}`);

    try {
      // Exchange the Google id_token for a Firebase identity via signInWithIdp
      const idpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postBody: `id_token=${googleIdToken}&providerId=google.com`,
            requestUri: GOOGLE_AUTH_CALLBACK,
            returnSecureToken: true,
            sessionId: pending.firebaseSessionId,
          }),
        }
      );
      const idpData: any = await idpRes.json();
      if (idpData.error) throw new Error(idpData.error.message || 'Google token exchange failed');

      const uid = idpData.localId;
      if (!uid) throw new Error('No UID returned from identity provider');

      const { createCustomToken } = await import('./firebase-admin');
      const customToken = await createCustomToken(uid);
      // Store under appSid so the polling endpoint can find it
      googleAuthSessions.set(appSid, { customToken, ts: Date.now() });

      return res.json({ ok: true });
    } catch (err) {
      console.error('[google/exchange] error:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Exchange failed' });
    }
  });

  // iOS helper: poll for custom token
  app.get("/api/auth/google/result/:sid", (req, res) => {
    const entry = googleAuthSessions.get(req.params.sid);
    if (!entry) return res.json({ ready: false });
    if (Date.now() - entry.ts > GOOGLE_SESSION_TTL) {
      googleAuthSessions.delete(req.params.sid);
      return res.status(410).json({ error: "Session expired, please try again" });
    }
    googleAuthSessions.delete(req.params.sid); // single-use
    return res.json({ ready: true, customToken: entry.customToken });
  });

  // ── Apple Sign-In via Browser (Android Capacitor) ───────────────────────────
  // Same pattern as Google: open system browser → server exchanges token → poll for result.
  const APPLE_AUTH_CALLBACK = 'https://hardisk.co/apple-auth';

  app.get("/apple-auth", async (req: any, res: any) => {
    const appSid = (req.query.sid as string) || null;

    // ── Case A: fresh request from the Android app ──
    if (appSid) {
      try {
        const createAuthRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerId: 'apple.com', continueUri: APPLE_AUTH_CALLBACK }),
          }
        );
        const createAuthData: any = await createAuthRes.json();
        if (!createAuthData.authUri) throw new Error('Firebase createAuthUri returned no authUri for Apple');

        googleOAuthPending.set(`apple_${appSid}`, { firebaseSessionId: createAuthData.sessionId, ts: Date.now() });
        googleOAuthPending.set(`fb_apple_${createAuthData.sessionId}`, { firebaseSessionId: appSid, ts: Date.now() });
        return res.redirect(302, createAuthData.authUri);
      } catch (err) {
        console.error('[apple-auth] initiation error:', err);
        return res.status(500).type('html').send(
          `<p style="font-family:sans-serif;color:#f87171;padding:2rem">
           Apple Sign-in setup failed:<br>${err instanceof Error ? err.message : String(err)}<br>
           Please go back to the app and try again.</p>`
        );
      }
    }

    // ── Case B: callback from Apple (id_token in URL hash or POST body) ──
    const callbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Completing sign-in…</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Outfit:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Outfit',sans-serif;background:#0a0a0f;color:#fff;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem}
    .card{text-align:center;max-width:340px;width:100%}
    .logo{font-size:2.5rem;margin-bottom:1rem}
    h2{font-family:'Space Grotesk',sans-serif;font-size:1.25rem;font-weight:700;margin-bottom:.5rem}
    p{color:rgba(255,255,255,.55);font-size:.875rem;line-height:1.5}
    .spin{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:#10b981;
          border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 1.2rem}
    @keyframes spin{to{transform:rotate(360deg)}}
    .err{color:#f87171!important}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">₿</div>
  <div class="spin" id="spin"></div>
  <h2 id="title">Completing sign-in…</h2>
  <p id="sub">Please wait</p>
</div>
<script>
  function ui(title, sub, isErr) {
    document.getElementById('title').textContent = title;
    var subEl = document.getElementById('sub');
    subEl.textContent = sub || '';
    if (isErr) {
      document.getElementById('spin').style.display = 'none';
      subEl.className = 'err';
    }
  }
  (async function () {
    try {
      var hash = new URLSearchParams(location.hash.slice(1));
      var idToken = hash.get('id_token');
      if (!idToken) {
        ui('Nothing to complete', 'Please start sign-in from the app.', true);
        return;
      }
      ui('Almost done\\u2026', 'Securing your account');
      var r = await fetch('/api/auth/apple/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idToken })
      });
      var data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || 'Exchange failed');
      ui('\\u2713 Signed in!', 'Returning to app\\u2026');
      setTimeout(function () { location.href = '/auth-complete'; }, 500);
    } catch (e) {
      ui('Sign-in failed', (e && e.message) ? e.message : 'Please go back and try again.', true);
    }
  })();
</script>
</body>
</html>`;
    res.type("html").send(callbackHtml);
  });

  // Exchange Apple id_token → Firebase custom token
  app.post("/api/auth/apple/exchange", async (req: any, res: any) => {
    const { idToken: appleIdToken } = req.body || {};
    if (!appleIdToken) return res.status(400).json({ error: 'Missing idToken' });

    // Find the pending Apple session
    let appSidKey: string | null = null;
    let rawSid: string | null = null;
    let pending: { firebaseSessionId: string; ts: number } | null = null;

    const appleEntries = Array.from(googleOAuthPending.entries());
    for (const [key, val] of appleEntries) {
      if (!key.startsWith('apple_') || key.startsWith('fb_apple_')) continue;
      if (Date.now() - val.ts < OAUTH_PENDING_TTL) {
        appSidKey = key;
        rawSid = key.slice('apple_'.length);
        pending = val;
        break;
      }
    }

    if (!appSidKey || !rawSid || !pending) {
      return res.status(400).json({ error: 'Auth session expired or not found — please try again' });
    }
    googleOAuthPending.delete(appSidKey);

    try {
      const idpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postBody: `id_token=${appleIdToken}&providerId=apple.com`,
            requestUri: APPLE_AUTH_CALLBACK,
            returnSecureToken: true,
            sessionId: pending.firebaseSessionId,
          }),
        }
      );
      const idpData: any = await idpRes.json();
      if (idpData.error) throw new Error(idpData.error.message || 'Apple token exchange failed');

      const uid = idpData.localId;
      if (!uid) throw new Error('No UID returned from identity provider');

      const { createCustomToken } = await import('./firebase-admin');
      const customToken = await createCustomToken(uid);
      googleAuthSessions.set(appSidKey, { customToken, ts: Date.now() });

      return res.json({ ok: true });
    } catch (err) {
      console.error('[apple/exchange] error:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Exchange failed' });
    }
  });

  // Android helper: poll for Apple custom token
  app.get("/api/auth/apple/result/:sid", (req, res) => {
    const key = `apple_${req.params.sid}`;
    const entry = googleAuthSessions.get(key);
    if (!entry) return res.json({ ready: false });
    if (Date.now() - entry.ts > GOOGLE_SESSION_TTL) {
      googleAuthSessions.delete(key);
      return res.status(410).json({ error: "Session expired, please try again" });
    }
    googleAuthSessions.delete(key);
    return res.json({ ready: true, customToken: entry.customToken });
  });

  // Sync Firebase user into database so admin can manage
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization || "";
      const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
      const idToken = tokenFromHeader || req.body?.idToken;

      if (!idToken) {
        console.warn("Auth sync: No ID token provided");
        return res.status(401).json({ error: "Missing auth token" });
      }

      let payload;
      try {
        payload = await authService.verifyToken(idToken);
        console.log("Auth sync: Token verified, payload keys:", payload ? Object.keys(payload) : "null");
        console.log("Auth sync: Payload details:", JSON.stringify(payload, null, 2));
      } catch (verifyError) {
        console.error("Auth sync: Token verification error:", verifyError);
        return res.status(401).json({ error: `Token verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}` });
      }
      
      if (!payload) {
        console.warn("Auth sync: Token verification returned null");
        return res.status(401).json({ error: "Token verification failed - no payload returned" });
      }
      
      // Firebase DecodedIdToken has 'uid' and 'email' (email may be in different places)
      const uid = payload.uid;
      const email = payload.email || (payload as any).firebase?.identities?.email?.[0];
      
      if (!uid) {
        console.warn("Auth sync: Missing uid in payload", payload);
        return res.status(400).json({ error: "Invalid auth token - missing uid" });
      }
      
      if (!email) {
        console.warn("Auth sync: Missing email in payload", payload);
        return res.status(400).json({ error: "Invalid auth token - missing email. Please sign in with an email-based account." });
      }

      const displayName = (payload as any).name || (payload as any).displayName || undefined;
      const photoUrl = (payload as any).picture || (payload as any).photoURL || undefined;
      console.log("Auth sync: Creating/updating user", { uid, email, displayName });
      
      let result;
      try {
        result = await authService.getOrCreateUser(payload.uid, email, displayName, photoUrl);
      } catch (dbError) {
        console.error("Auth sync: Database error during user creation:", dbError);
        return res.status(500).json({ error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown'}` });
      }

      if (!result.success || !result.user) {
        console.error("Auth sync failed:", result.error);
        return res.status(500).json({ error: result.error || "Failed to sync user" });
      }

      console.log("Auth sync: User created/updated", { userId: result.user.id, email: result.user.email });

      // ── Attribute referral code if provided ──
      const referralCode = req.body?.referralCode as string | undefined;
      if (referralCode && result.user) {
        try {
          const { growthService } = await import("./services/growthService");
          await growthService.attributeReferral(result.user.id, referralCode);
        } catch (refErr) {
          console.error("Referral attribution error (non-fatal):", refErr);
        }
      }

      res.json({ user: result.user });
    } catch (error) {
      console.error("Error syncing auth user:", error);
      res.status(500).json({ error: `Failed to sync user: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // ============ DEPOSIT REQUESTS ============

  // Create a deposit request
  app.post("/api/deposits/request", async (req, res) => {
    try {
      const { userId, amount, currency, network, walletAddress } = req.body;
      const { depositRequests, notifications } = await import("@shared/schema");
      
      console.log("Deposit request received:", { userId, amount, currency, network, walletAddress });
      
      if (!userId || !amount || !currency || !network || !walletAddress) {
        console.error("Missing required fields:", { userId, amount, currency, network, walletAddress });
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Resolve userId - could be Firebase UID or database ID
      let resolvedUserId = await resolveDbUserId(userId);
      
      // If user not found in database, try to create them from Authorization header
      if (!resolvedUserId) {
        console.log("User not found in DB, attempting to create from auth token...");
        const authHeader = req.headers.authorization || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
        
        if (idToken) {
          try {
            const payload = await authService.verifyToken(idToken);
            if (payload?.uid && payload.email) {
              console.log("Creating user from token:", { uid: payload.uid, email: payload.email });
              const result = await authService.getOrCreateUser(payload.uid, payload.email, (payload as any).name, (payload as any).picture);
              if (result.success && result.user) {
                resolvedUserId = result.user.id;
                console.log("User created/found:", resolvedUserId);
              }
            }
          } catch (tokenError) {
            console.error("Failed to create user from token:", tokenError);
          }
        }
      }
      
      if (!resolvedUserId) {
        console.error("User not found and could not be created:", userId);
        return res.status(404).json({ error: "User not found. Please log out and log in again to sync your account." });
      }

      // Create deposit request with resolved database user ID
      const [request] = await db.insert(depositRequests).values({
        userId: resolvedUserId,
        amount: parseFloat(amount),
        currency,
        network,
        walletAddress,
        status: "pending",
      }).returning();

      console.log("Deposit request created:", request.id);

      // Create notification for user
      await db.insert(notifications).values({
        userId: resolvedUserId,
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Deposit request error details:", { 
        errorMessage, 
        errorName: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: `Failed to create deposit request: ${errorMessage}` });
    }
  });

  // Get user's deposit requests
  app.get("/api/deposits/requests/:userId", async (req, res) => {
    try {
      const { depositRequests } = await import("@shared/schema");
      const resolvedUserId = await resolveDbUserId(req.params.userId);
      if (!resolvedUserId) return res.status(404).json({ error: "User not found" });
      
      const requests = await db.select()
        .from(depositRequests)
        .where(eq(depositRequests.userId, resolvedUserId))
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
      const resolvedUserId = await resolveDbUserId(req.params.userId);
      if (!resolvedUserId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const userWallets = await db.select()
        .from(wallets)
        .where(eq(wallets.userId, resolvedUserId));
      
      // Define all supported coins in the desired order
      const supportedCoins = [
        { symbol: "USDT", name: "Tether" },
        { symbol: "BTC", name: "Bitcoin" },
        { symbol: "LTC", name: "Litecoin" },
        { symbol: "USDC", name: "USD Coin" },
        { symbol: "ETH", name: "Ethereum" },
        { symbol: "ZCASH", name: "Zcash" },
        { symbol: "BNB", name: "BNB" },
        { symbol: "TON", name: "Toncoin" },
      ];

      // Create a map of existing wallets
      const walletMap = new Map(userWallets.map(w => [w.symbol.toUpperCase(), w]));

      // Ensure all supported coins are included (with 0 balance if not exists)
      const allBalances = supportedCoins.map(coin => {
        const existingWallet = walletMap.get(coin.symbol);
        if (existingWallet) {
          return existingWallet;
        }
        // Return placeholder for coins user doesn't have yet
        return {
          id: `placeholder-${coin.symbol}`,
          userId: resolvedUserId,
          symbol: coin.symbol,
          name: coin.name,
          balance: 0,
          address: null,
          createdAt: new Date().toISOString(),
        };
      });
      
      // Get pending deposits
      const { depositRequests } = await import("@shared/schema");
      const pending = await db.select()
        .from(depositRequests)
        .where(and(
          eq(depositRequests.userId, resolvedUserId),
          eq(depositRequests.status, "pending")
        ));
      
      const pendingByCurrency: Record<string, number> = {};
      pending.forEach(p => {
        pendingByCurrency[p.currency] = (pendingByCurrency[p.currency] || 0) + p.amount;
      });
      
      res.json({
        balances: allBalances,
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

      const resolvedUserId = await resolveDbUserId(userId);
      const numericAmount = toFiniteNumber(amount);
      const orderCurrency = (currency || "USDT") as string;
      
      if (!resolvedUserId || !type || !productName || numericAmount === null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (numericAmount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }

      // Check balance if paying from balance
      if (paymentMethod === "balance") {
        const userWallets = await db.select()
          .from(wallets)
          .where(and(eq(wallets.userId, resolvedUserId), eq(wallets.symbol, orderCurrency)));
        
        if (userWallets.length === 0 || userWallets[0].balance < numericAmount) {
          return res.status(400).json({ 
            error: "Insufficient balance",
            required: numericAmount,
            available: userWallets[0]?.balance || 0
          });
        }

        // Deduct balance
        await db.update(wallets)
          .set({ balance: userWallets[0].balance - numericAmount })
          .where(eq(wallets.id, userWallets[0].id));
      }

      // Create order
      const [order] = await db.insert(orders).values({
        userId: resolvedUserId,
        type,
        productId,
        productName,
        amount: numericAmount,
        currency: orderCurrency,
        metadata,
        paymentMethod: paymentMethod || "balance",
        balanceDeducted: paymentMethod === "balance",
        status: "completed", // Immediate completion for balance payments
        completedAt: paymentMethod === "balance" ? new Date() : null,
      }).returning();

      // Create notification
      await db.insert(notifications).values({
        userId: resolvedUserId,
        type: "order",
        category: "user",
        title: "Order Completed",
        message: `Your purchase of ${productName} for $${numericAmount} ${orderCurrency} was successful!`,
        priority: "normal",
        data: { orderId: order.id, amount: numericAmount, productName },
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

  // ============ DATABASE ADMIN ROUTES ============

  // Get pending deposits for admin
  app.get("/api/admin/deposits/pending", async (_req, res) => {
    try {
      const { depositRequests, users: usersTable } = await import("@shared/schema");
      const pending = await db.select({
        id: depositRequests.id,
        userId: depositRequests.userId,
        amount: depositRequests.amount,
        currency: depositRequests.currency,
        network: depositRequests.network,
        walletAddress: depositRequests.walletAddress,
        status: depositRequests.status,
        createdAt: depositRequests.createdAt,
        userEmail: usersTable.email,
        userDisplayName: usersTable.displayName,
      })
        .from(depositRequests)
        .leftJoin(usersTable, eq(depositRequests.userId, usersTable.id))
        .where(eq(depositRequests.status, "pending"))
        .orderBy(desc(depositRequests.createdAt));
      
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pending deposits" });
    }
  });

  // Get all deposits for admin
  app.get("/api/admin/deposits/all", async (_req, res) => {
    try {
      const { depositRequests, users: usersTable } = await import("@shared/schema");
      const deposits = await db.select({
        id: depositRequests.id,
        userId: depositRequests.userId,
        amount: depositRequests.amount,
        currency: depositRequests.currency,
        network: depositRequests.network,
        walletAddress: depositRequests.walletAddress,
        status: depositRequests.status,
        createdAt: depositRequests.createdAt,
        confirmedAt: depositRequests.confirmedAt,
        userEmail: usersTable.email,
        userDisplayName: usersTable.displayName,
      })
        .from(depositRequests)
        .leftJoin(usersTable, eq(depositRequests.userId, usersTable.id))
        .orderBy(desc(depositRequests.createdAt))
        .limit(100);
      
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deposits" });
    }
  });

  // Get admin dashboard stats (deposit/withdrawal totals)
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const { depositRequests, withdrawalRequests } = await import("@shared/schema");
      
      // Get deposit stats
      const depositStats = await db.select({
        status: depositRequests.status,
        totalAmount: sql<number>`COALESCE(SUM(${depositRequests.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
        .from(depositRequests)
        .groupBy(depositRequests.status);

      // Get withdrawal stats
      const withdrawalStats = await db.select({
        status: withdrawalRequests.status,
        totalAmount: sql<number>`COALESCE(SUM(${withdrawalRequests.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
        .from(withdrawalRequests)
        .groupBy(withdrawalRequests.status);

      // Parse stats into a friendly format
      const depositTotals = {
        pending: { amount: 0, count: 0 },
        confirmed: { amount: 0, count: 0 },
        rejected: { amount: 0, count: 0 },
      };
      depositStats.forEach(s => {
        if (s.status in depositTotals) {
          depositTotals[s.status as keyof typeof depositTotals] = {
            amount: Number(s.totalAmount) || 0,
            count: Number(s.count) || 0,
          };
        }
      });

      const withdrawalTotals = {
        pending: { amount: 0, count: 0 },
        completed: { amount: 0, count: 0 },
        rejected: { amount: 0, count: 0 },
      };
      withdrawalStats.forEach(s => {
        if (s.status in withdrawalTotals) {
          withdrawalTotals[s.status as keyof typeof withdrawalTotals] = {
            amount: Number(s.totalAmount) || 0,
            count: Number(s.count) || 0,
          };
        }
      });

      res.json({
        deposits: depositTotals,
        withdrawals: withdrawalTotals,
      });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ error: "Failed to get admin stats" });
    }
  });

  // Confirm a deposit (admin action)
  app.post("/api/admin/deposits/:depositId/confirm", async (req, res) => {
    try {
      const { depositId } = req.params;
      const { depositRequests, wallets } = await import("@shared/schema");
      
      // Get deposit request
      const [deposit] = await db.select()
        .from(depositRequests)
        .where(eq(depositRequests.id, depositId));
      
      if (!deposit) {
        return res.status(404).json({ error: "Deposit request not found" });
      }
      
      if (deposit.status !== "pending") {
        return res.status(400).json({ error: "Deposit already processed" });
      }

      // Update deposit status
      await db.update(depositRequests)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(eq(depositRequests.id, depositId));

      // Credit user's wallet
      const [existingWallet] = await db.select()
        .from(wallets)
        .where(and(eq(wallets.userId, deposit.userId), eq(wallets.symbol, deposit.currency)));
      
      if (existingWallet) {
        await db.update(wallets)
          .set({ balance: existingWallet.balance + deposit.amount })
          .where(eq(wallets.id, existingWallet.id));
      } else {
        // Create new wallet for this currency
        await db.insert(wallets).values({
          userId: deposit.userId,
          symbol: deposit.currency,
          name: deposit.currency,
          balance: deposit.amount,
        });
      }

      // Create notification for user
      await db.insert(notifications).values({
        userId: deposit.userId,
        type: "deposit",
        category: "user",
        title: "🎉 Deposit Confirmed!",
        message: `✅ Your deposit of ${deposit.amount} ${deposit.currency} has been confirmed and credited to your account. 🚀 Start mining now!`,
        priority: "high",
        data: { depositId, amount: deposit.amount, currency: deposit.currency },
      });

      res.json({ success: true, message: "Deposit confirmed and balance credited" });
    } catch (error) {
      console.error("Error confirming deposit:", error);
      res.status(500).json({ error: "Failed to confirm deposit" });
    }
  });

  // Reject a deposit (admin action)
  app.post("/api/admin/deposits/:depositId/reject", async (req, res) => {
    try {
      const { depositId } = req.params;
      const { reason } = req.body;
      const { depositRequests } = await import("@shared/schema");
      
      // Get deposit request
      const [deposit] = await db.select()
        .from(depositRequests)
        .where(eq(depositRequests.id, depositId));
      
      if (!deposit) {
        return res.status(404).json({ error: "Deposit request not found" });
      }
      
      if (deposit.status !== "pending") {
        return res.status(400).json({ error: "Deposit already processed" });
      }

      // Update deposit status
      await db.update(depositRequests)
        .set({ 
          status: "rejected", 
          adminNote: reason || "Deposit could not be verified"
        })
        .where(eq(depositRequests.id, depositId));

      // Create notification for user
      await db.insert(notifications).values({
        userId: deposit.userId,
        type: "deposit",
        category: "user",
        title: "❌ Deposit Request Rejected",
        message: `Your deposit request for ${deposit.amount} ${deposit.currency} was rejected. Reason: ${reason || "Could not verify transaction"} 📧 Please contact support for assistance.`,
        priority: "high",
        data: { depositId, amount: deposit.amount, currency: deposit.currency, reason },
      });

      res.json({ success: true, message: "Deposit rejected and user notified" });
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      res.status(500).json({ error: "Failed to reject deposit" });
    }
  });

  // Block/unblock user (admin action)
  app.post("/api/admin/users/:userId/block", async (req, res) => {
    try {
      const { userId } = req.params;
      const { block } = req.body;
      
      if (!userId || block === undefined) {
        return res.status(400).json({ error: "Missing userId or block parameter" });
      }

      const [updatedUser] = await db.update(users)
        .set({ isActive: !block })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await db.insert(adminActions).values({
        adminId: "system",
        targetUserId: userId,
        actionType: block ? "block_user" : "unblock_user",
        details: { blocked: block },
      }).catch(() => {}); // Ignore if adminActions table doesn't exist

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Adjust user balance (admin action)
  app.post("/api/admin/users/:userId/adjust-balance", async (req, res) => {
    try {
      const { userId } = req.params;
      const { symbol, amount, type, reason } = req.body; // type: 'add' or 'deduct'
      
      if (!userId || !symbol || amount === undefined || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (type !== "add" && type !== "deduct") {
        return res.status(400).json({ error: "Type must be 'add' or 'deduct'" });
      }

      // Get or create wallet
      const { wallets: walletsTable } = await import("@shared/schema");
      const existing = await db.select()
        .from(walletsTable)
        .where(and(eq(walletsTable.userId, userId), eq(walletsTable.symbol, symbol)));
      
      let wallet;
      if (existing.length > 0) {
        const newBalance = type === "add" 
          ? existing[0].balance + amount 
          : existing[0].balance - amount;
        
        if (newBalance < 0) {
          return res.status(400).json({ error: "Insufficient balance to deduct" });
        }

        [wallet] = await db.update(walletsTable)
          .set({ balance: newBalance })
          .where(eq(walletsTable.id, existing[0].id))
          .returning();
      } else {
        if (type === "deduct") {
          return res.status(400).json({ error: "User has no wallet for this currency" });
        }
        [wallet] = await db.insert(walletsTable).values({
          userId,
          symbol,
          name: symbol,
          balance: amount,
        }).returning();
      }

      // Create notification for user
      await db.insert(notifications).values({
        userId,
        type: "balance",
        category: "user",
        title: type === "add" ? "💰 Balance Added!" : "⚠️ Balance Adjusted",
        message: `${type === "add" ? "✅ BlockMint added" : "⚠️ BlockMint deducted"} ${amount} ${symbol} ${type === "add" ? "to" : "from"} your account${reason ? ": " + reason : ". Thank you!"}.`,
        priority: "normal",
        data: { symbol, amount, type, reason },
      });

      // Log admin action
      await db.insert(adminActions).values({
        adminId: "system",
        targetUserId: userId,
        actionType: "adjust_balance",
        details: { symbol, amount, type, reason },
      }).catch(() => {});

      res.json({ success: true, wallet });
    } catch (error) {
      console.error("Error adjusting balance:", error);
      res.status(500).json({ error: "Failed to adjust balance" });
    }
  });

  // Admin disable 2FA for user
  app.post("/api/admin/users/:userId/disable-2fa", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ error: "2FA is not enabled for this user" });
      }

      // Disable 2FA and clear secret
      await db.update(users)
        .set({ 
          twoFactorEnabled: false,
          twoFactorSecret: null
        })
        .where(eq(users.id, userId));

      // Create notification for user
      await db.insert(notifications).values({
        userId,
        type: "security",
        category: "user",
        title: "🔐 Two-Factor Authentication Disabled",
        message: "Your two-factor authentication has been disabled by support at your request. You can re-enable it anytime from Settings > Security.",
        priority: "high",
        data: { action: "2fa_disabled_by_admin" },
      });

      // Log admin action
      await db.insert(adminActions).values({
        adminId: "system",
        targetUserId: userId,
        actionType: "disable_2fa",
        details: { userEmail: user.email },
      }).catch(() => {});

      console.log(`Admin disabled 2FA for user: ${user.email}`);
      res.json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  // Get all config for admin
  app.get("/api/admin/config", async (_req, res) => {
    try {
      const { appConfig } = await import("@shared/schema");
      const configs = await db.select()
        .from(appConfig)
        .orderBy(appConfig.key);
      
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get config" });
    }
  });

  // Add new config (admin)
  app.post("/api/admin/config", async (req, res) => {
    try {
      const { key, value, category, description } = req.body;
      const { appConfig } = await import("@shared/schema");
      
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }

      // Check if key already exists
      const existing = await db.select()
        .from(appConfig)
        .where(eq(appConfig.key, key));
      
      if (existing.length > 0) {
        // Update existing
        await db.update(appConfig)
          .set({ value, category, description, updatedAt: new Date() })
          .where(eq(appConfig.key, key));
        res.json({ success: true, message: "Config updated" });
      } else {
        // Insert new
        const [config] = await db.insert(appConfig).values({
          key,
          value,
          category: category || "settings",
          description,
          isActive: true,
        }).returning();
        res.json({ success: true, config });
      }
    } catch (error) {
      console.error("Error adding config:", error);
      res.status(500).json({ error: "Failed to add config" });
    }
  });

  // Update config by ID (admin)
  app.put("/api/admin/config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { value } = req.body;
      const { appConfig } = await import("@shared/schema");
      
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }

      await db.update(appConfig)
        .set({ value, updatedAt: new Date() })
        .where(eq(appConfig.id, id));
      
      res.json({ success: true, message: "Config updated" });
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ error: "Failed to update config" });
    }
  });

  // Delete config by ID (admin)
  app.delete("/api/admin/config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { appConfig } = await import("@shared/schema");
      
      await db.delete(appConfig).where(eq(appConfig.id, id));
      
      res.json({ success: true, message: "Config deleted" });
    } catch (error) {
      console.error("Error deleting config:", error);
      res.status(500).json({ error: "Failed to delete config" });
    }
  });

  // Broadcast notification to all users
  app.post("/api/admin/notifications/broadcast", async (req, res) => {
    try {
      const { title, message } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }

      const { notificationService } = await import("./services/notificationService");
      const count = await notificationService.createBroadcast(title, message, "promotion");
      
      res.json({ success: true, count, message: `Notification sent to ${count} users` });
    } catch (error) {
      console.error("Error sending broadcast:", error);
      res.status(500).json({ error: "Failed to send broadcast" });
    }
  });

  // ============ TWO-FACTOR AUTHENTICATION ============

  // Generate 2FA secret and QR code
  app.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body; // Firebase UID
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Get user by Firebase UID
      const user = await db.select().from(users).where(eq(users.firebaseUid, userId)).limit(1);
      if (!user.length) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate secret
      const secret = generateSecret();

      // Generate OTP Auth URL
      const otpauth = `otpauth://totp/BlockMint Mining:${user[0].email}?secret=${secret}&issuer=BlockMint Mining`;

      // Generate QR code
      const qrCode = await QRCode.toDataURL(otpauth);

      // Save secret (but don't enable 2FA yet)
      await db.update(users)
        .set({ twoFactorSecret: secret })
        .where(eq(users.id, user[0].id));

      res.json({
        secret,
        qrCode,
        manualEntry: secret,
        otpauth
      });
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  });

  // Verify 2FA token and enable 2FA
  app.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { userId, token } = req.body; // Firebase UID
      
      if (!userId || !token) {
        return res.status(400).json({ error: "User ID and token are required" });
      }

      // Get user by Firebase UID
      const user = await db.select().from(users).where(eq(users.firebaseUid, userId)).limit(1);
      if (!user.length || !user[0].twoFactorSecret) {
        return res.status(404).json({ error: "2FA not set up for this user" });
      }

      // Verify token (otplib functions are async and return { valid: boolean })
      const verifyResult = await verify({ token, secret: user[0].twoFactorSecret });
      const isValid = verifyResult.valid;

      if (!isValid) {
        return res.status(400).json({ error: "Invalid token" });
      }

      // Enable 2FA
      await db.update(users)
        .set({ twoFactorEnabled: true })
        .where(eq(users.id, user[0].id));

      res.json({ success: true, message: "2FA enabled successfully" });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  });

  // Disable 2FA
  app.post("/api/auth/2fa/disable", async (req, res) => {
    try {
      const { userId, token } = req.body; // Firebase UID
      
      if (!userId || !token) {
        return res.status(400).json({ error: "User ID and token are required" });
      }

      // Get user by Firebase UID
      const user = await db.select().from(users).where(eq(users.firebaseUid, userId)).limit(1);
      if (!user.length || !user[0].twoFactorEnabled) {
        return res.status(404).json({ error: "2FA not enabled for this user" });
      }

      // Verify token before disabling (otplib functions are async and return { valid: boolean })
      const verifyResult = await verify({ token, secret: user[0].twoFactorSecret! });
      const isValid = verifyResult.valid;

      if (!isValid) {
        return res.status(400).json({ error: "Invalid token" });
      }

      // Disable 2FA and clear secret
      await db.update(users)
        .set({ 
          twoFactorEnabled: false,
          twoFactorSecret: null
        })
        .where(eq(users.id, user[0].id));

      res.json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  // Check 2FA status
  app.get("/api/auth/2fa/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params; // Firebase UID
      
      const user = await db.select({
        twoFactorEnabled: users.twoFactorEnabled
      }).from(users).where(eq(users.firebaseUid, userId)).limit(1);
      
      if (!user.length) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        enabled: user[0].twoFactorEnabled || false 
      });
    } catch (error) {
      console.error("Error checking 2FA status:", error);
      res.status(500).json({ error: "Failed to check 2FA status" });
    }
  });

  // Verify 2FA token for login
  app.post("/api/auth/2fa/verify-login", async (req, res) => {
    try {
      const { userId, token } = req.body; // Firebase UID
      
      if (!userId || !token) {
        return res.status(400).json({ error: "User ID and token are required" });
      }

      // Get user by Firebase UID
      const user = await db.select().from(users).where(eq(users.firebaseUid, userId)).limit(1);
      if (!user.length || !user[0].twoFactorEnabled) {
        return res.status(404).json({ error: "2FA not enabled for this user" });
      }

      // Verify token (otplib functions are async and return { valid: boolean })
      console.log("Verifying 2FA token for user:", userId);
      console.log("Token received:", token);
      console.log("User has secret:", !!user[0].twoFactorSecret);
      
      const verifyResult = await verify({ token, secret: user[0].twoFactorSecret! });
      const isValid = verifyResult.valid;
      console.log("Token verification result:", isValid);

      if (!isValid) {
        return res.status(400).json({ error: "Invalid token" });
      }

      res.json({ success: true, message: "2FA verified successfully" });
    } catch (error) {
      console.error("Error verifying 2FA login:", error);
      res.status(500).json({ error: "Verification failed. Please try again." });
    }
  });

  // ============ ACCOUNT DELETION (App Store Requirement) ============
  
  // Request account deletion
  app.delete("/api/auth/account/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const token = authHeader.slice(7);
      const decoded = await authService.verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }
      
      // Resolve the database user ID
      const dbUserId = await resolveDbUserId(userId);
      if (!dbUserId) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify the user is deleting their own account
      const [user] = await db.select().from(users).where(eq(users.id, dbUserId)).limit(1);
      if (!user || user.firebaseUid !== decoded.uid) {
        return res.status(403).json({ error: "Cannot delete another user's account" });
      }
      
      // Check for pending withdrawals or deposits
      const pendingWithdrawals = await db.select()
        .from(withdrawalRequests)
        .where(and(eq(withdrawalRequests.userId, dbUserId), eq(withdrawalRequests.status, "pending")));
      
      if (pendingWithdrawals.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete account with pending withdrawals",
          pendingCount: pendingWithdrawals.length
        });
      }
      
      const pendingDeposits = await db.select()
        .from(depositRequests)
        .where(and(eq(depositRequests.userId, dbUserId), eq(depositRequests.status, "pending")));
      
      if (pendingDeposits.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete account with pending deposits",
          pendingCount: pendingDeposits.length
        });
      }
      
      // Soft delete: Mark user as inactive and anonymize data
      await db.update(users)
        .set({
          isActive: false,
          email: `deleted_${Date.now()}@deleted.blockmint.app`,
          displayName: "Deleted User",
          photoUrl: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
        })
        .where(eq(users.id, dbUserId));
      
      // Delete notifications
      await db.delete(notifications).where(eq(notifications.userId, dbUserId));
      
      // Log the deletion for audit
      await db.insert(adminActions).values({
        adminId: dbUserId,
        actionType: "account_deletion_request",
        targetUserId: dbUserId,
        details: { deletedAt: new Date().toISOString(), reason: "user_requested" },
      });
      
      // Delete from Firebase Auth
      try {
        const { deleteUser } = await import("./firebase-admin");
        await deleteUser(decoded.uid);
      } catch (firebaseError) {
        console.error("Failed to delete Firebase user:", firebaseError);
        // Continue anyway - user is already deactivated in our DB
      }
      
      res.json({ 
        success: true, 
        message: "Account deletion initiated. Your data will be permanently removed within 30 days." 
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // ============ PRODUCT MANAGEMENT (Admin) ============

  // Get all products
  app.get("/api/admin/products", async (_req, res) => {
    try {
      const { products } = await import("@shared/schema");
      const allProducts = await db.select()
        .from(products)
        .orderBy(desc(products.createdAt));
      res.json(allProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Create a new product
  app.post("/api/admin/products", async (req, res) => {
    try {
      const { type, name, description, basePrice, currency, metadata } = req.body;
      const { products } = await import("@shared/schema");
      
      if (!type || !name || basePrice === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [product] = await db.insert(products).values({
        type,
        name,
        description,
        basePrice,
        currency: currency || "USDT",
        metadata: metadata || {},
        isActive: true,
      }).returning();

      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product
  app.patch("/api/admin/products/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const { name, description, basePrice, currency, metadata, isActive } = req.body;
      const { products } = await import("@shared/schema");
      
      const [product] = await db.update(products)
        .set({
          ...(name && { name }),
          ...(description && { description }),
          ...(basePrice !== undefined && { basePrice }),
          ...(currency && { currency }),
          ...(metadata && { metadata }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // ============ RECURRING BALANCE MANAGEMENT (Admin) ============

  // Get all recurring balances
  app.get("/api/admin/recurring-balances", async (_req, res) => {
    try {
      const { recurringBalances } = await import("@shared/schema");
      const balances = await db.select()
        .from(recurringBalances)
        .orderBy(desc(recurringBalances.createdAt));
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recurring balances" });
    }
  });

  // Get recurring balances for a specific user
  app.get("/api/admin/recurring-balances/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { recurringBalances } = await import("@shared/schema");
      const balances = await db.select()
        .from(recurringBalances)
        .where(eq(recurringBalances.userId, userId))
        .orderBy(desc(recurringBalances.createdAt));
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user recurring balances" });
    }
  });

  // Create recurring balance (admin)
  app.post("/api/admin/recurring-balances", async (req, res) => {
    try {
      const { userId, symbol, amount, frequency, startDate, endDate, reason, adminId } = req.body;
      const { recurringBalances } = await import("@shared/schema");
      
      if (!userId || !symbol || !amount || !frequency) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({ error: "Frequency must be daily, weekly, or monthly" });
      }

      // Calculate next execution time
      const start = new Date(startDate || new Date());
      const next = new Date(start);
      if (frequency === "daily") next.setDate(next.getDate() + 1);
      else if (frequency === "weekly") next.setDate(next.getDate() + 7);
      else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);

      const [balance] = await db.insert(recurringBalances).values({
        userId,
        symbol,
        amount: parseFloat(amount),
        frequency,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextExecutionAt: next,
        reason: reason || `${frequency} ${symbol} bonus`,
        adminId,
        isActive: true,
      }).returning();

      res.json(balance);
    } catch (error) {
      console.error("Error creating recurring balance:", error);
      res.status(500).json({ error: "Failed to create recurring balance" });
    }
  });

  // Update recurring balance
  app.patch("/api/admin/recurring-balances/:balanceId", async (req, res) => {
    try {
      const { balanceId } = req.params;
      const { amount, frequency, endDate, isActive, reason } = req.body;
      const { recurringBalances } = await import("@shared/schema");
      
      const [balance] = await db.update(recurringBalances)
        .set({
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(frequency && { frequency }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(isActive !== undefined && { isActive }),
          ...(reason && { reason }),
        })
        .where(eq(recurringBalances.id, balanceId))
        .returning();

      res.json(balance);
    } catch (error) {
      console.error("Error updating recurring balance:", error);
      res.status(500).json({ error: "Failed to update recurring balance" });
    }
  });

  // Delete recurring balance
  app.delete("/api/admin/recurring-balances/:balanceId", async (req, res) => {
    try {
      const { balanceId } = req.params;
      const { recurringBalances } = await import("@shared/schema");
      
      await db.delete(recurringBalances)
        .where(eq(recurringBalances.id, balanceId));

      res.json({ success: true, message: "Recurring balance deleted" });
    } catch (error) {
      console.error("Error deleting recurring balance:", error);
      res.status(500).json({ error: "Failed to delete recurring balance" });
    }
  });

  // ============ CRON JOBS ============

  // Execute recurring balances (call this from a cron job every 5-10 minutes)
  app.post("/api/cron/execute-recurring-balances", async (req, res) => {
    try {
      // Optional: Add simple auth check
      const authToken = req.headers["authorization"];
      const expectedToken = process.env.CRON_SECRET || "default-cron-secret";
      
      if (!authToken || !authToken.includes(expectedToken)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { RecurringBalanceService } = await import("./services/recurringBalanceService");
      const result = await RecurringBalanceService.executeRecurring();
      
      res.json({
        success: true,
        timestamp: new Date(),
        ...result
      });
    } catch (error) {
      console.error("Error executing cron job:", error);
      res.status(500).json({ error: "Failed to execute cron job" });
    }
  });

  // Get recurring balance stats
  app.get("/api/cron/recurring-stats", async (req, res) => {
    try {
      const { RecurringBalanceService } = await import("./services/recurringBalanceService");
      const stats = await RecurringBalanceService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // ============ REFERRAL SYSTEM ============

  // Generate or get user's referral code
  app.get("/api/referral/code/:userId", async (req, res) => {
    try {
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (user?.referralCode) {
        return res.json({ code: user.referralCode });
      }
      
      // Generate new code
      const code = `REF-${userId.slice(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
      
      await db.update(users)
        .set({ referralCode: code })
        .where(eq(users.id, userId));
      
      res.json({ code });
    } catch (error) {
      console.error("Failed to get referral code:", error);
      res.status(500).json({ error: "Failed to get referral code" });
    }
  });

  // Get referral stats for user
  app.get("/api/referral/stats/:userId", async (req, res) => {
    try {
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { referrals, referralPayouts } = await import("@shared/schema");
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      const allReferrals = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId));
      
      const pendingPayouts = await db.select()
        .from(referralPayouts)
        .where(and(
          eq(referralPayouts.referrerId, userId),
          eq(referralPayouts.status, "pending")
        ));
      
      const completedPayouts = await db.select()
        .from(referralPayouts)
        .where(and(
          eq(referralPayouts.referrerId, userId),
          eq(referralPayouts.status, "completed")
        ));
      
      res.json({
        referralCode: user?.referralCode,
        walletType: user?.referralWalletType,
        walletAddress: user?.referralWalletAddress,
        totalReferrals: allReferrals.length,
        pendingReferrals: allReferrals.filter(r => r.status === "pending").length,
        qualifiedReferrals: allReferrals.filter(r => r.status === "qualified" || r.status === "rewarded").length,
        pendingEarnings: pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalEarnings: completedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0),
        referrals: allReferrals,
      });
    } catch (error) {
      console.error("Failed to get referral stats:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });

  // Save user's payout wallet
  app.post("/api/referral/wallet", async (req, res) => {
    try {
      const { userId: rawUserId, walletType, walletAddress } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      // Validate wallet format
      if (walletType === "trc20" && !walletAddress.startsWith("T")) {
        return res.status(400).json({ error: "Invalid TRC20 address. Must start with T" });
      }
      
      if (walletType === "binance_pay" && !/^\d{8,9}$/.test(walletAddress)) {
        return res.status(400).json({ error: "Invalid Binance Pay ID. Must be 8-9 digits" });
      }
      
      await db.update(users)
        .set({ 
          referralWalletType: walletType,
          referralWalletAddress: walletAddress 
        })
        .where(eq(users.id, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save wallet:", error);
      res.status(500).json({ error: "Failed to save wallet" });
    }
  });

  // Apply referral code during signup
  app.post("/api/referral/apply", async (req, res) => {
    try {
      const { userId: rawUserId, userEmail, referralCode } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { referrals } = await import("@shared/schema");
      
      // Find referrer by code
      const [referrer] = await db.select()
        .from(users)
        .where(eq(users.referralCode, referralCode));
      
      if (!referrer) {
        return res.status(404).json({ error: "Invalid referral code" });
      }
      
      if (referrer.id === userId) {
        return res.status(400).json({ error: "Cannot use your own referral code" });
      }
      
      // Create referral record
      await db.insert(referrals).values({
        referrerId: referrer.id,
        referredUserId: userId,
        referredEmail: userEmail,
        referralCode: referralCode,
        status: "pending",
      });
      
      // Mark user as referred
      await db.update(users)
        .set({ referredBy: referrer.id })
        .where(eq(users.id, userId));
      
      res.json({ success: true, referrerName: referrer.displayName || "Friend" });
    } catch (error) {
      console.error("Failed to apply referral:", error);
      res.status(500).json({ error: "Failed to apply referral code" });
    }
  });

  // Check and qualify referral when user makes purchase >= $100
  app.post("/api/referral/check-qualification", async (req, res) => {
    try {
      const { userId: rawUserId, purchaseAmount } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { referrals, referralPayouts } = await import("@shared/schema");
      
      if (purchaseAmount < 100) {
        return res.json({ qualified: false });
      }
      
      // Find if this user was referred
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user?.referredBy) {
        return res.json({ qualified: false, reason: "User not referred" });
      }
      
      // Find the referral record
      const [referral] = await db.select()
        .from(referrals)
        .where(and(
          eq(referrals.referredUserId, userId),
          eq(referrals.status, "pending")
        ));
      
      if (!referral) {
        return res.json({ qualified: false, reason: "No pending referral" });
      }
      
      // Get referrer's wallet info
      const [referrer] = await db.select().from(users).where(eq(users.id, referral.referrerId));
      
      // Update referral to qualified
      await db.update(referrals)
        .set({ 
          status: "qualified",
          qualifiedAt: new Date()
        })
        .where(eq(referrals.id, referral.id));
      
      // If referrer has wallet set up, create payout request
      if (referrer?.referralWalletType && referrer?.referralWalletAddress) {
        await db.insert(referralPayouts).values({
          referralId: referral.id,
          referrerId: referral.referrerId,
          amount: 5,
          walletType: referrer.referralWalletType,
          walletAddress: referrer.referralWalletAddress,
          status: "pending",
        });
      }
      
      // Notify referrer
      await db.insert(notifications).values({
        userId: referral.referrerId,
        title: "Referral Reward Earned!",
        message: `Your friend made a qualifying purchase! You've earned $5. ${referrer?.referralWalletAddress ? "Your reward will be sent soon." : "Add your wallet address to claim."}`,
        type: "reward",
      });
      
      res.json({ qualified: true });
    } catch (error) {
      console.error("Failed to check qualification:", error);
      res.status(500).json({ error: "Failed to check qualification" });
    }
  });

  // Admin: Get all pending referral payouts
  app.get("/api/admin/referral-payouts", async (req, res) => {
    try {
      const { referralPayouts, referrals } = await import("@shared/schema");
      
      const payouts = await db.select({
        payout: referralPayouts,
        referral: referrals,
      })
      .from(referralPayouts)
      .leftJoin(referrals, eq(referralPayouts.referralId, referrals.id))
      .where(eq(referralPayouts.status, "pending"));
      
      // Enrich with user info
      const enrichedPayouts = await Promise.all(payouts.map(async (p) => {
        const [referrer] = await db.select().from(users).where(eq(users.id, p.payout.referrerId));
        return {
          ...p.payout,
          referrerEmail: referrer?.email,
          referrerName: referrer?.displayName,
          referredEmail: p.referral?.referredEmail,
          qualifiedAt: p.referral?.qualifiedAt,
        };
      }));
      
      res.json(enrichedPayouts);
    } catch (error) {
      console.error("Failed to get payouts:", error);
      res.status(500).json({ error: "Failed to get payouts" });
    }
  });

  // Admin: Mark payout as completed
  app.post("/api/admin/referral-payouts/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const { referralPayouts, referrals } = await import("@shared/schema");
      
      const [payout] = await db.select().from(referralPayouts).where(eq(referralPayouts.id, id));
      
      await db.update(referralPayouts)
        .set({ 
          status: "completed",
          adminNotes,
          processedAt: new Date()
        })
        .where(eq(referralPayouts.id, id));
      
      // Update referral status
      if (payout?.referralId) {
        await db.update(referrals)
          .set({ status: "rewarded" })
          .where(eq(referrals.id, payout.referralId));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to complete payout:", error);
      res.status(500).json({ error: "Failed to complete payout" });
    }
  });

  // ============ FEEDBACK REWARD SYSTEM ============

  // Check if user is eligible for feedback reward
  app.get("/api/feedback/eligibility/:userId", async (req, res) => {
    try {
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { feedbackRewards } = await import("@shared/schema");
      
      // Check if already claimed
      const [existing] = await db.select()
        .from(feedbackRewards)
        .where(eq(feedbackRewards.userId, userId));
      
      if (existing) {
        return res.json({ 
          eligible: false, 
          reason: existing.status === "claimed" ? "Already claimed" : "Pending",
          reward: existing
        });
      }
      
      // Check if user has been active for 7+ days
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user?.createdAt) {
        return res.json({ eligible: false, reason: "User not found" });
      }
      
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceSignup < 7) {
        return res.json({ 
          eligible: false, 
          reason: "Need 7 days active",
          daysRemaining: 7 - daysSinceSignup
        });
      }
      
      res.json({ eligible: true });
    } catch (error) {
      console.error("Failed to check eligibility:", error);
      res.status(500).json({ error: "Failed to check eligibility" });
    }
  });

  // Claim feedback reward
  app.post("/api/feedback/claim", async (req, res) => {
    try {
      const { userId: rawUserId, platform } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { feedbackRewards } = await import("@shared/schema");
      
      // Check not already claimed
      const [existing] = await db.select()
        .from(feedbackRewards)
        .where(eq(feedbackRewards.userId, userId));
      
      if (existing) {
        return res.status(400).json({ error: "Already claimed" });
      }
      
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year
      
      // Create feedback reward record
      await db.insert(feedbackRewards).values({
        userId,
        platform,
        claimedAt: new Date(),
        rewardAmount: 20,
        hashrateTHs: 0.8,
        expiryDate,
        status: "claimed",
      });
      
      // Create mining purchase for the hashrate reward (non-withdrawable)
      await db.insert(miningPurchases).values({
        userId,
        packageName: "Feedback Reward",
        crypto: "BTC",
        amount: 20, // $20 value
        hashrate: 0.8,
        hashrateUnit: "TH/s",
        dailyReturnBTC: 0.00000123,
        returnPercent: 150,
        paybackMonths: 12,
        expiryDate,
        status: "active",
      });
      
      // Send notification
      await db.insert(notifications).values({
        userId,
        title: "Thank You For Your Feedback!",
        message: "You've earned $20 in mining credits and 0.8 TH/s hashrate for 1 year!",
        type: "reward",
      });
      
      res.json({ 
        success: true,
        reward: {
          amount: 20,
          hashrate: 0.8,
          expiryDate,
        }
      });
    } catch (error) {
      console.error("Failed to claim reward:", error);
      res.status(500).json({ error: "Failed to claim reward" });
    }
  });

  // ============ USER SECURITY (PIN/BIOMETRICS) ============

  // Get user security settings
  app.get("/api/security/settings/:userId", async (req, res) => {
    try {
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { userSecurity } = await import("@shared/schema");
      
      const [settings] = await db.select()
        .from(userSecurity)
        .where(eq(userSecurity.userId, userId));
      
      if (!settings) {
        return res.json({
          pinLockEnabled: false,
          biometricEnabled: false,
          hasPinSet: false,
        });
      }
      
      res.json({
        pinLockEnabled: settings.pinLockEnabled,
        biometricEnabled: settings.biometricEnabled,
        hasPinSet: !!settings.pinHash,
        lockedUntil: settings.lockedUntil,
      });
    } catch (error) {
      console.error("Failed to get security settings:", error);
      res.status(500).json({ error: "Failed to get security settings" });
    }
  });

  // Set/Update PIN
  app.post("/api/security/pin", async (req, res) => {
    try {
      const { userId: rawUserId, pin } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }
      
      const { userSecurity } = await import("@shared/schema");
      
      // Simple hash (in production, use bcrypt)
      const crypto = await import("crypto");
      const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
      
      // Upsert security record
      const [existing] = await db.select()
        .from(userSecurity)
        .where(eq(userSecurity.userId, userId));
      
      if (existing) {
        await db.update(userSecurity)
          .set({ pinHash, pinLockEnabled: true, updatedAt: new Date() })
          .where(eq(userSecurity.userId, userId));
      } else {
        await db.insert(userSecurity).values({
          userId,
          pinHash,
          pinLockEnabled: true,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to set PIN:", error);
      res.status(500).json({ error: "Failed to set PIN" });
    }
  });

  // Verify PIN
  app.post("/api/security/verify-pin", async (req, res) => {
    try {
      const { userId: rawUserId, pin } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { userSecurity } = await import("@shared/schema");
      
      const [settings] = await db.select()
        .from(userSecurity)
        .where(eq(userSecurity.userId, userId));
      
      if (!settings?.pinHash) {
        return res.status(400).json({ error: "No PIN set" });
      }
      
      // Check if locked
      if (settings.lockedUntil && new Date(settings.lockedUntil) > new Date()) {
        return res.status(423).json({ 
          error: "Account locked", 
          lockedUntil: settings.lockedUntil 
        });
      }
      
      const crypto = await import("crypto");
      const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
      
      if (pinHash !== settings.pinHash) {
        const newAttempts = (settings.failedAttempts || 0) + 1;
        let lockedUntil = null;
        
        if (newAttempts >= 5) {
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        }
        
        await db.update(userSecurity)
          .set({ failedAttempts: newAttempts, lockedUntil })
          .where(eq(userSecurity.userId, userId));
        
        return res.status(401).json({ 
          error: "Incorrect PIN",
          attemptsRemaining: Math.max(0, 5 - newAttempts)
        });
      }
      
      // Reset failed attempts on success
      await db.update(userSecurity)
        .set({ failedAttempts: 0, lockedUntil: null })
        .where(eq(userSecurity.userId, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to verify PIN:", error);
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Toggle biometric
  app.post("/api/security/biometric", async (req, res) => {
    try {
      const { userId: rawUserId, enabled, credentialId } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { userSecurity } = await import("@shared/schema");
      
      const [existing] = await db.select()
        .from(userSecurity)
        .where(eq(userSecurity.userId, userId));
      
      if (existing) {
        await db.update(userSecurity)
          .set({ 
            biometricEnabled: enabled,
            biometricCredentialId: credentialId || null,
            updatedAt: new Date()
          })
          .where(eq(userSecurity.userId, userId));
      } else {
        await db.insert(userSecurity).values({
          userId,
          biometricEnabled: enabled,
          biometricCredentialId: credentialId,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to toggle biometric:", error);
      res.status(500).json({ error: "Failed to toggle biometric" });
    }
  });

  // Disable PIN lock
  app.post("/api/security/disable-pin", async (req, res) => {
    try {
      const { userId: rawUserId } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });
      
      const { userSecurity } = await import("@shared/schema");
      
      await db.update(userSecurity)
        .set({ pinLockEnabled: false, updatedAt: new Date() })
        .where(eq(userSecurity.userId, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to disable PIN:", error);
      res.status(500).json({ error: "Failed to disable PIN" });
    }
  });

  // Support Contact Form
  app.post("/api/support", async (req, res) => {
    try {
      const { subject, description, userEmail, accountEmail } = req.body;
      
      if (!subject || !description || !userEmail) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Try to use Resend if API key is available
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);

        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🛠️ BlockMint Support Request</h1>
            </div>
            <div style="background: #1a1a24; padding: 30px; border-radius: 0 0 10px 10px; color: #e5e5e5;">
              <h2 style="color: #f59e0b; margin-top: 0;">${subject}</h2>
              
              <div style="background: #252532; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${description}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
              
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #888;">Contact Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${userEmail}" style="color: #f59e0b;">${userEmail}</a></td>
                </tr>
                ${accountEmail ? `
                <tr>
                  <td style="padding: 8px 0; color: #888;">Account Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${accountEmail}" style="color: #f59e0b;">${accountEmail}</a></td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #888;">Submitted:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
              This message was sent from BlockMint Support Form
            </p>
          </div>
        `;

        // Send to both support emails
        await resend.emails.send({
          from: "BlockMint Support <support@hardisk.co>",
          to: ["info@hardisk.co", "iamberonacci@gmail.com"],
          replyTo: userEmail,
          subject: `[Support] ${subject}`,
          html: emailContent,
        });

        // Send confirmation to user
        await resend.emails.send({
          from: "BlockMint Support <support@hardisk.co>",
          to: userEmail,
          subject: "We received your support request - BlockMint",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Message Received</h1>
              </div>
              <div style="background: #1a1a24; padding: 30px; border-radius: 0 0 10px 10px; color: #e5e5e5;">
                <p>Thank you for contacting BlockMint Support!</p>
                <p>We have received your message regarding: <strong>${subject}</strong></p>
                <p>Our support team will review your request and get back to you within 24-48 hours.</p>
                <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
                <p style="color: #888; font-size: 14px;">
                  If you have any additional information to add, please reply to this email.
                </p>
              </div>
            </div>
          `,
        });

        console.log("Support email sent successfully via Resend");
      } else {
        // Fallback: Store in database for manual processing
        console.log("RESEND_API_KEY not set, logging support request:");
        console.log({ subject, description, userEmail, accountEmail, timestamp: new Date().toISOString() });
        
        // You could also store in a support_requests table
      }

      res.json({ success: true, message: "Support request submitted successfully" });
    } catch (error) {
      console.error("Failed to send support email:", error);
      res.status(500).json({ error: "Failed to send support request" });
    }
  });

  // ============ STRIPE PAYMENTS ============

  // Get Stripe publishable key and status for frontend
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const settings = await stripeService.getStripeSettings();
      if (!settings || !settings.isEnabled) {
        return res.json({ enabled: false });
      }
      const publishableKey = await stripeService.getPublishableKey();
      res.json({
        enabled: true,
        publishableKey,
        currency: settings.currency,
        minAmount: settings.minPaymentAmount,
        maxAmount: settings.maxPaymentAmount,
        mode: settings.mode,
      });
    } catch (error) {
      console.error("Stripe config error:", error);
      res.status(500).json({ error: "Failed to fetch Stripe config" });
    }
  });

  // Create a payment intent
  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    try {
      const { userId: rawUserId, amount, productType, productId, productName, metadata } = req.body;
      const userId = await resolveDbUserId(rawUserId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });

      // Get user email
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return res.status(404).json({ error: "User not found" });

      const result = await stripeService.createPaymentIntent({
        userId,
        email: user.email,
        displayName: user.displayName || undefined,
        amount: parseFloat(amount),
        productType,
        productId,
        productName,
        metadata,
      });

      if (!result) {
        return res.status(400).json({ error: "Stripe is not enabled or not configured" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Create payment intent error:", error);
      res.status(400).json({ error: error.message || "Failed to create payment" });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const Stripe = (await import("stripe")).default;
      const sig = req.headers["stripe-signature"];
      const webhookSecret = await stripeService.getWebhookSecret();
      
      if (!sig || !webhookSecret) {
        return res.status(400).json({ error: "Missing signature or webhook secret" });
      }

      const stripe = await stripeService.getStripe();
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      let event: any;
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          sig as string,
          webhookSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle events
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          await stripeService.handlePaymentSuccess(
            paymentIntent.id,
            paymentIntent.charges?.data?.[0]?.receipt_url
          );

          // ── Trigger referral qualification for the purchasing user ──
          try {
            const { stripePayments } = await import("@shared/schema");
            const [payRec] = await db.select().from(stripePayments)
              .where(eq(stripePayments.stripePaymentIntentId, paymentIntent.id));
            if (payRec?.userId) {
              const { growthService } = await import("./services/growthService");
              await growthService.qualifyReferral(payRec.userId, {
                amount: payRec.amount,
                currency: payRec.currency,
                purchaseId: payRec.id,
              });
              // Also fire purchase reward rules
              const { rewardsService } = await import("./services/rewardsService");
              await rewardsService.checkAndTriggerRewards(payRec.userId, "deposit", {
                amount: payRec.amount,
                currency: payRec.currency,
              });
            }
          } catch (growthErr) {
            console.error("Post-payment growth hook error (non-fatal):", growthErr);
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          await stripeService.handlePaymentFailure(
            paymentIntent.id,
            paymentIntent.last_payment_error?.message
          );
          break;
        }
        case "charge.refunded": {
          const charge = event.data.object;
          if (charge.payment_intent) {
            const refundedAmount = charge.amount_refunded / 100;
            // Update payment record
            const { stripePayments } = await import("@shared/schema");
            await db
              .update(stripePayments)
              .set({
                status: "refunded",
                refundedAmount,
                refundedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(stripePayments.stripePaymentIntentId, charge.payment_intent as string));
          }
          break;
        }
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  // Get user's payment history
  app.get("/api/stripe/payments/:userId", async (req, res) => {
    try {
      const userId = await resolveDbUserId(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user" });

      const payments = await stripeService.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Fetch payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  return httpServer;
}
