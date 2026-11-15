import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const defaultWebDistDirectory = fileURLToPath(
  new URL("../../../dist/", import.meta.url),
);

export function createApp(
  webDistDirectory = defaultWebDistDirectory,
): Express {
  const app: Express = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );
  const trustedOrigins = new Set<string>();
  for (const origin of (process.env["ADMIN_CORS_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    try {
      trustedOrigins.add(new URL(origin).origin);
    } catch {
      // Invalid configured origins are ignored rather than broadening CORS.
    }
  }

  for (const domain of [
    ...(process.env["REPLIT_DOMAINS"] ?? "").split(","),
    process.env["REPLIT_DEV_DOMAIN"] ?? "",
  ]) {
    const normalizedDomain = domain.trim();
    if (normalizedDomain) trustedOrigins.add(`https://${normalizedDomain}`);
  }

  if (process.env["APP_URL"]) {
    try {
      trustedOrigins.add(new URL(process.env["APP_URL"]).origin);
    } catch {
      // Invalid configured origins are ignored rather than broadening CORS.
    }
  }

  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (!origin) {
      next();
      return;
    }

    const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
    const requestHost = forwardedHost || req.get("host");
    const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const requestProtocol = forwardedProtocol || req.protocol;
    const sameOrigin = requestHost
      ? `${requestProtocol}://${requestHost}`
      : undefined;

    if (origin === sameOrigin) {
      next();
      return;
    }

    if (!trustedOrigins.has(origin)) {
      res.status(403).json({ error: "This origin is not allowed." });
      return;
    }

    cors({
      origin,
      methods: ["GET", "PATCH", "POST", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
      maxAge: 600,
    })(req, res, next);
  });
  // Four bounded OHLC series may exceed the default 100 KB parser limit.
  // Keep the existing limit unchanged for every other application endpoint.
  app.use("/api/workspace/trading/analyze", express.json({ limit: "192kb" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", router);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });

  app.use(express.static(webDistDirectory, { index: false }));
  app.get("/{*splat}", (req, res, next) => {
    if (!req.accepts("html")) {
      next();
      return;
    }

    res.sendFile(path.join(webDistDirectory, "index.html"), (error) => {
      if (error) next(error);
    });
  });

  return app;
}

const app = createApp();

export default app;
