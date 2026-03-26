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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ── Reverse-proxy Firebase Auth handler so authDomain can be our own domain ──
// This makes signInWithPopup same-origin (no cross-site storage issues on iOS).
app.all("/__/auth/*", async (req, res) => {
  const firebaseHost = `${process.env.VITE_FIREBASE_PROJECT_ID || "blockmint"}.firebaseapp.com`;
  const targetUrl = `https://${firebaseHost}${req.originalUrl}`;
  try {
    const headers: Record<string, string> = {
      "X-Forwarded-Host": req.hostname,
    };
    // Forward relevant request headers
    if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"] as string;
    if (req.headers["accept"]) headers["accept"] = req.headers["accept"] as string;
    if (req.headers["accept-language"]) headers["accept-language"] = req.headers["accept-language"] as string;
    if (req.headers["cookie"]) headers["cookie"] = req.headers["cookie"] as string;

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
      redirect: "manual",
    });

    // Forward status, headers, body back to client
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      // Skip hop-by-hop headers
      if (!["transfer-encoding", "connection", "keep-alive"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
  } catch (err) {
    console.error("[__/auth proxy] error:", err);
    res.status(502).send("Auth proxy error");
  }
});

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

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
  const shutdown = () => {
    log("SIGTERM received, shutting down gracefully...");
    httpServer.close(() => {
      log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
