// @vitest-environment node
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AdminSupabaseConfigError,
  DESIGNATED_ADMIN_EMAIL,
} from "../src/lib/admin-supabase";
import { MarketDataService } from "../src/lib/market-data/service";
import { createWorkspaceRouter } from "../src/routes/workspace";

const MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_ID = "33333333-3333-4333-8333-333333333333";

function makeUser(
  id: string,
  status: string,
  options: { email?: string; verified?: boolean; role?: string } = {},
): User {
  const verified = options.verified ?? true;
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: options.email ?? "member@example.test",
    email_confirmed_at: verified ? "2025-01-01T00:00:00.000Z" : null,
    confirmed_at: verified ? "2025-01-01T00:00:00.000Z" : null,
    created_at: "2025-01-01T00:00:00.000Z",
    last_sign_in_at: null,
    app_metadata: { role: options.role ?? "trader", membership_status: status },
    user_metadata: {},
    identities: [],
    factors: [],
    is_anonymous: false,
  } as User;
}

function createHarness() {
  const usersByToken = new Map<string, User>([
    ["active-token", makeUser(MEMBER_ID, "active")],
    ["pending-token", makeUser(MEMBER_ID, "pending")],
    ["suspended-token", makeUser(MEMBER_ID, "suspended")],
    ["revoked-token", makeUser(MEMBER_ID, "expired")],
    ["unverified-token", makeUser(MEMBER_ID, "active", { verified: false })],
    [
      "admin-token",
      makeUser(MEMBER_ID, "active", {
        email: DESIGNATED_ADMIN_EMAIL,
        role: "admin",
      }),
    ],
  ]);
  const client = {
    auth: {
      getUser: vi.fn(async (token: string) => {
        const user = usersByToken.get(token);
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: new Error("invalid token") };
      }),
    },
  } as unknown as SupabaseClient;
  const app = express();
  app.use(express.json());
  app.use(
    "/api",
    createWorkspaceRouter(
      () => client,
      new MarketDataService({ env: {} }),
    ),
  );
  return { app, client, usersByToken };
}

describe("server-enforced workspace membership", () => {
  it("rejects missing and invalid bearer tokens", async () => {
    const { app, client } = createHarness();

    const missing = await request(app).get("/api/workspace/access").expect(401);
    expect(missing.body.code).toBe("AUTH_REQUIRED");

    const invalid = await request(app)
      .get("/api/workspace/access")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
    expect(invalid.body.code).toBe("INVALID_TOKEN");
    expect(client.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["pending", "pending-token", "MEMBERSHIP_PENDING"],
    ["suspended", "suspended-token", "MEMBERSHIP_SUSPENDED"],
    ["revoked", "revoked-token", "MEMBERSHIP_REVOKED"],
  ])("denies %s users with a current status response", async (_label, token, code) => {
    const { app } = createHarness();
    const response = await request(app)
      .get("/api/workspace/access")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(response.body.code).toBe(code);
    expect(response.body.membershipStatus).toBe(
      code === "MEMBERSHIP_REVOKED" ? "expired" : code.replace("MEMBERSHIP_", "").toLowerCase(),
    );
    expect(response.body.error).toBeTruthy();
  });

  it.each([
    ["pending-token", "MEMBERSHIP_PENDING"],
    ["suspended-token", "MEMBERSHIP_SUSPENDED"],
    ["revoked-token", "MEMBERSHIP_REVOKED"],
  ])("blocks direct workspace API paths for token %s", async (token, expectedCode) => {
    const { app } = createHarness();
    const protectedPaths = [
      "/api/workspace/trading",
      "/api/workspace/strategies",
      "/api/workspace/news",
      "/api/workspace/risk",
      "/api/workspace/mt5",
      "/api/workspace/signals",
      "/api/workspace/backtesting",
      "/api/workspace/records",
      "/api/workspace/market-data/status",
    ];

    for (const path of protectedPaths) {
      const response = await request(app)
        .get(path)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
      expect(response.body.code).toBe(expectedCode);
    }
  });

  it.each([
    ["pending-token", "MEMBERSHIP_PENDING"],
    ["suspended-token", "MEMBERSHIP_SUSPENDED"],
    ["revoked-token", "MEMBERSHIP_REVOKED"],
  ])("blocks the trading analysis POST for %s before analysis runs", async (token, expectedCode) => {
    const { app } = createHarness();
    const response = await request(app)
      .post("/api/workspace/trading/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ symbol: "BTCUSD", timeframes: {} })
      .expect(403);
    expect(response.body.code).toBe(expectedCode);
  });

  it.each([
    ["pending-token", "MEMBERSHIP_PENDING"],
    ["suspended-token", "MEMBERSHIP_SUSPENDED"],
    ["revoked-token", "MEMBERSHIP_REVOKED"],
  ])("blocks provider-backed analysis for %s before provider access", async (token, expectedCode) => {
    const { app } = createHarness();
    const response = await request(app)
      .post("/api/workspace/market-data/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ symbol: "BTCUSD" })
      .expect(403);
    expect(response.body.code).toBe(expectedCode);
  });

  it("reports provider readiness without exposing credentials and keeps CSV available", async () => {
    const { app } = createHarness();
    const status = await request(app)
      .get("/api/workspace/market-data/status")
      .set("Authorization", "Bearer active-token")
      .expect(200);
    expect(status.body.connectionState).toBe("configuration_required");
    expect(status.body.dataMode).toBe("unavailable");
    expect(status.body.message).toMatch(/CSV imports remain available/);

    const analysis = await request(app)
      .post("/api/workspace/market-data/analyze")
      .set("Authorization", "Bearer active-token")
      .send({ symbol: "BTCUSD" })
      .expect(503);
    expect(analysis.body.code).toBe("PROVIDER_NOT_CONFIGURED");
    expect(JSON.stringify(analysis.body)).not.toMatch(/api.?key|secret/i);
  });

  it("permits an approved administrator while returning NO TRADE without candle data", async () => {
    const { app } = createHarness();
    const response = await request(app)
      .post("/api/workspace/trading/analyze")
      .set("Authorization", "Bearer admin-token")
      .send({ symbol: "BTCUSD", timeframes: {} })
      .expect(200);
    expect(response.body.signal.decision).toBe("NO_TRADE");
    expect(response.body.dataSource).toBe("unavailable");
  });

  it("validates analysis input only after approval and rejects malformed candles", async () => {
    const { app } = createHarness();
    await request(app)
      .post("/api/workspace/trading/analyze")
      .set("Authorization", "Bearer active-token")
      .send({ symbol: "", timeframes: {} })
      .expect(400);
    const invalidCandle = await request(app)
      .post("/api/workspace/trading/analyze")
      .set("Authorization", "Bearer active-token")
      .send({
        symbol: "BTCUSD",
        timeframes: { "30M": [{ timestamp: 1700000000000, open: 100, high: 50, low: 90, close: 95 }] },
      })
      .expect(400);
    expect(invalidCandle.body.error).toMatch(/invalid OHLC/);
  });

  it("requires email verification before membership approval", async () => {
    const { app } = createHarness();
    const response = await request(app)
      .get("/api/workspace/access")
      .set("Authorization", "Bearer unverified-token")
      .expect(403);

    expect(response.body.code).toBe("EMAIL_UNVERIFIED");
  });

  it("returns only the authenticated user's identity for approved access", async () => {
    const { app } = createHarness();
    const response = await request(app)
      .get(`/api/workspace/access?userId=${OTHER_ID}`)
      .set("Authorization", "Bearer active-token")
      .expect(200);

    expect(response.body).toEqual({
      userId: MEMBER_ID,
      membershipStatus: "active",
    });
    expect(response.body.userId).not.toBe(OTHER_ID);
  });

  it("preserves active designated-admin access without accepting client role claims", async () => {
    const { app } = createHarness();
    const response = await request(app)
      .get("/api/workspace/access")
      .set("Authorization", "Bearer admin-token")
      .expect(200);

    expect(response.body.userId).toBe(MEMBER_ID);
    expect(response.body.membershipStatus).toBe("active");
  });

  it("rechecks server-managed membership on every request using the same access token", async () => {
    const { app, usersByToken, client } = createHarness();
    await request(app)
      .get("/api/workspace/access")
      .set("Authorization", "Bearer active-token")
      .expect(200);

    usersByToken.set("active-token", makeUser(MEMBER_ID, "suspended"));
    const denied = await request(app)
      .get("/api/workspace/access")
      .set("Authorization", "Bearer active-token")
      .expect(403);

    expect(denied.body.code).toBe("MEMBERSHIP_SUSPENDED");
    expect(client.auth.getUser).toHaveBeenCalledTimes(2);
  });

  it("fails closed when server-side membership verification is not configured", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      "/api",
      createWorkspaceRouter(() => {
        throw new AdminSupabaseConfigError();
      }),
    );

    const response = await request(app)
      .get("/api/workspace/access")
      .set("Authorization", "Bearer active-token")
      .expect(503);

    expect(response.body.code).toBe("MEMBERSHIP_CHECK_UNAVAILABLE");
  });
});
