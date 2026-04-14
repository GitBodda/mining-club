import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { registerAdminRoutes } from "./admin-routes";
import { registerGrowthRoutes } from "./growth-routes";
import { initializeFirebaseAdmin } from "./firebase-admin";
import { serveStatic } from "./static";
import { createServer } from "http";
import { ensureTablesExist } from "./ensure-tables";
import posthog from "./posthog";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ── Health check (MUST be first — Cloud Run probes this before secrets/DB are ready) ──
const healthPayload = () => ({
  status: "ok",
  uptime: process.uptime(),
  revision: process.env.K_REVISION || process.env.SCW_CONTAINER_ID || null,
  version: process.env.APP_VERSION || process.env.RELEASE_VERSION || process.env.npm_package_version || null,
  commit: process.env.GIT_SHA || process.env.COMMIT_SHA || null,
  now: new Date().toISOString(),
});

app.get("/_health", (_req, res) => {
  res.status(200).json(healthPayload());
});
app.get("/api/health", (_req, res) => {
  res.status(200).json(healthPayload());
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Firebase Admin SDK
  initializeFirebaseAdmin();
  
  // Ensure all database tables exist (auto-migration)
  // Wrapped in try/catch so the server still starts even if DB is temporarily unavailable
  try {
    await ensureTablesExist();
  } catch (err) {
    console.error("WARNING: ensureTablesExist failed (DB may be unavailable):", err);
  }
  
  // Serve attached assets statically
  const attachedAssetsPath = path.resolve(__dirname, "..", "attached_assets");
  app.use("/attached_assets", express.static(attachedAssetsPath));
  
  // Register routes
  await registerRoutes(httpServer, app);
  await registerAdminRoutes(app);
  registerGrowthRoutes(app);

  // ── Weekly mining profit distributor ──
  // Runs every Sunday at 00:05 server time (checks every 30 min)
  const WEEKLY_PROFIT_KEY = "lastWeeklyMiningProfitDate";
  const checkAndRunWeeklyProfit = async () => {
    try {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const isEarlyMorning = now.getHours() === 0; // 00:xx
      if (!isSunday || !isEarlyMorning) return;

      const todayStr = now.toISOString().slice(0, 10);
      // Use a simple in-memory flag per server instance (restarts reset it — acceptable)
      const lastRun = (globalThis as any).__lastWeeklyMiningRun;
      if (lastRun === todayStr) return;
      (globalThis as any).__lastWeeklyMiningRun = todayStr;

      log("[WeeklyProfit] Distributing weekly mining profits...");
      const { db } = await import("./db");
      const { miningPurchases, wallets, notifications } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const activePurchases = await db.select().from(miningPurchases).where(eq(miningPurchases.status, "active"));
      const byUser: Record<string, typeof activePurchases> = {};
      for (const p of activePurchases) {
        if (!byUser[p.userId]) byUser[p.userId] = [];
        byUser[p.userId].push(p);
      }

      let processed = 0;
      for (const [userId, purchases] of Object.entries(byUser)) {
        const weeklyBTC = purchases.reduce((sum, p) => sum + (p.dailyReturnBTC || 0) * 7, 0);
        if (weeklyBTC <= 0) continue;

        const [existingWallet] = await db.select().from(wallets).where(and(eq(wallets.userId, userId), eq(wallets.symbol, "BTC")));
        if (existingWallet) {
          await db.update(wallets).set({ balance: existingWallet.balance + weeklyBTC }).where(eq(wallets.id, existingWallet.id));
        } else {
          await db.insert(wallets).values({ userId, symbol: "BTC", name: "Bitcoin", balance: weeklyBTC });
        }

        for (const p of purchases) {
          await db.update(miningPurchases).set({ totalEarned: (p.totalEarned || 0) + (p.dailyReturnBTC || 0) * 7, lastEarningAt: new Date() }).where(eq(miningPurchases.id, p.id));
        }

        await db.insert(notifications).values({
          userId, type: "purchase", category: "user",
          title: "⛏️ Weekly Mining Profit Paid",
          message: `Your weekly mining profit of ${weeklyBTC.toFixed(8)} BTC has been added to your wallet.`,
          priority: "normal", data: { weeklyBTC, purchaseCount: purchases.length },
        }).catch(() => {});

        processed++;
      }
      log(`[WeeklyProfit] Done — paid ${processed} users.`);
    } catch (err) {
      console.error("[WeeklyProfit] Error:", err);
    }
  };
  // Check every 30 minutes
  setInterval(checkAndRunWeeklyProfit, 30 * 60 * 1000);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    posthog.captureException(err);

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Cloud Run sets PORT=8080. Fall back to 5000 for local development.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Graceful shutdown — Cloud Run sends SIGTERM before killing container
  const shutdown = async () => {
    log("SIGTERM received, shutting down gracefully...");
    await posthog.shutdown();
    httpServer.close(() => {
      log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
