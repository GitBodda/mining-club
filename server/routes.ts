import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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
      const allowedKeys = ['miningIntensity', 'notificationsEnabled', 'autoMining', 'powerSaver', 'selectedPool'];
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

  return httpServer;
}
