// @vitest-environment node
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AdminSupabaseConfigError,
  DESIGNATED_ADMIN_EMAIL,
} from "../src/lib/admin-supabase";
import { createAdminRouter } from "../src/routes/admin";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const TRADER_ID = "22222222-2222-4222-8222-222222222222";
const LEGACY_ADMIN_ID = "33333333-3333-4333-8333-333333333333";

function makeUser(
  id: string,
  email: string,
  appMetadata: Record<string, unknown> = {},
  verified = true,
): User {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: verified ? "2025-01-01T00:00:00.000Z" : null,
    confirmed_at: verified ? "2025-01-01T00:00:00.000Z" : null,
    created_at: "2025-01-01T00:00:00.000Z",
    last_sign_in_at: null,
    app_metadata: appMetadata,
    user_metadata: {},
    identities: [],
    factors: [],
    is_anonymous: false,
  } as User;
}

function createHarness() {
  const adminUser = makeUser(ADMIN_ID, DESIGNATED_ADMIN_EMAIL, {
    provider: "email",
  });
  const trader = makeUser(TRADER_ID, "member@example.test", { membership_status: "pending" });
  const legacyAdmin = makeUser(LEGACY_ADMIN_ID, "legacy@example.test", {
    role: "admin",
    membership_status: "active",
  });
  const users = [adminUser, trader, legacyAdmin];

  const client = {
    auth: {
      getUser: vi.fn(async (token: string) => {
        if (token === "verified-admin-token") {
          return { data: { user: adminUser }, error: null };
        }
        if (token === "ordinary-user-token") {
          return { data: { user: trader }, error: null };
        }
        if (token === "unverified-admin-token") {
          return {
            data: { user: makeUser(ADMIN_ID, DESIGNATED_ADMIN_EMAIL, {}, false) },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error("invalid token") };
      }),
      admin: {
        updateUserById: vi.fn(async (id: string, attributes: { app_metadata?: Record<string, unknown> }) => {
          const target = users.find((user) => user.id === id);
          if (!target) return { data: { user: null }, error: new Error("not found") };
          target.app_metadata = attributes.app_metadata ?? target.app_metadata;
          return { data: { user: target }, error: null };
        }),
        getUserById: vi.fn(async (id: string) => {
          const user = users.find((candidate) => candidate.id === id);
          return user
            ? { data: { user }, error: null }
            : { data: { user: null }, error: new Error("not found") };
        }),
        listUsers: vi.fn(async ({ page, perPage }: { page: number; perPage: number }) => ({
          data: { users: users.slice((page - 1) * perPage, page * perPage) },
          error: null,
        })),
      },
    },
  } as unknown as SupabaseClient;

  const app = express();
  app.use(express.json());
  app.use("/api", createAdminRouter(() => client));
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ testError: error.message });
  });
  return { app, client, adminUser, trader, legacyAdmin };
}

describe("protected administrator API", () => {
  let harness: ReturnType<typeof createHarness>;

  beforeEach(() => {
    harness = createHarness();
  });

  it("rejects missing and invalid bearer tokens", async () => {
    await request(harness.app).get("/api/admin/users").expect(401);
    await request(harness.app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
    expect(harness.client.auth.admin.listUsers).not.toHaveBeenCalled();
  });

  it("rejects ordinary and unverified accounts without exposing the directory", async () => {
    await request(harness.app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer ordinary-user-token")
      .expect(403);
    await request(harness.app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer unverified-admin-token")
      .expect(403);
    expect(harness.client.auth.admin.listUsers).not.toHaveBeenCalled();
  });

  it("bootstraps only the verified designated admin and normalizes other roles", async () => {
    const response = await request(harness.app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer verified-admin-token");
    expect(response.status, JSON.stringify(response.body)).toBe(200);

    expect(response.body.admin.email).toBe(DESIGNATED_ADMIN_EMAIL);
    expect(response.body.admin.role).toBe("admin");
    expect(response.body.admin.membershipStatus).toBe("active");
    expect(response.body.users.find((user: { id: string }) => user.id === LEGACY_ADMIN_ID).role)
      .toBe("trader");
    expect(harness.client.auth.admin.updateUserById).toHaveBeenCalledWith(
      ADMIN_ID,
      expect.objectContaining({
        app_metadata: expect.objectContaining({ role: "admin", membership_status: "active" }),
      }),
    );
  });

  it.each(["pending", "active", "suspended", "expired"] as const)(
    "updates membership status to %s and keeps the target a trader",
    async (status) => {
      const response = await request(harness.app)
        .patch(`/api/admin/users/${TRADER_ID}/membership`)
        .set("Authorization", "Bearer verified-admin-token")
        .send({ status })
        .expect(200);

      expect(response.body.user.membershipStatus).toBe(status);
      expect(response.body.user.role).toBe("trader");
      expect(response.body.sessionsTerminated).toBe(false);
      expect(harness.trader.app_metadata).toMatchObject({
        membership_status: status,
        role: "trader",
      });
    },
  );

  it("rejects invalid status, malformed IDs, and changes to the administrator account", async () => {
    await request(harness.app)
      .patch(`/api/admin/users/${TRADER_ID}/membership`)
      .set("Authorization", "Bearer verified-admin-token")
      .send({ status: "admin" })
      .expect(400);
    await request(harness.app)
      .patch("/api/admin/users/not-a-uuid/membership")
      .set("Authorization", "Bearer verified-admin-token")
      .send({ status: "active" })
      .expect(400);
    await request(harness.app)
      .patch(`/api/admin/users/${ADMIN_ID}/membership`)
      .set("Authorization", "Bearer verified-admin-token")
      .send({ status: "suspended" })
      .expect(400);
  });

  it("reports the Supabase session-termination limitation instead of claiming success", async () => {
    const response = await request(harness.app)
      .post(`/api/admin/users/${TRADER_ID}/terminate-sessions`)
      .set("Authorization", "Bearer verified-admin-token")
      .expect(501);
    expect(response.body.error).toContain("requires the target user's access token");
  });

  it("fails closed when the server-side Supabase credentials are unavailable", async () => {
    const app = express();
    app.use("/api", createAdminRouter(() => {
      throw new AdminSupabaseConfigError();
    }));
    await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer verified-admin-token")
      .expect(503);
  });
});
