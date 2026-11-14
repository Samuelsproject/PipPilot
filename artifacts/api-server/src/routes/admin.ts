import { Router, type IRouter, type Request, type Response } from "express";
import {
  InitializeAdminResponse,
  ListAdminUsersResponse,
  TerminateAdminUserSessionsParams,
  UpdateAdminMembershipBody,
  UpdateAdminMembershipParams,
  UpdateAdminMembershipResponse,
} from "@workspace/api-zod";
import type { User } from "@supabase/supabase-js";
import {
  DESIGNATED_ADMIN_EMAIL,
  createAdminSupabaseClient,
  isDesignatedAdminEmail,
  isVerifiedDesignatedAdmin,
} from "../lib/admin-supabase";
import {
  createRequireDesignatedAdminIdentity,
  createRequireAdmin,
  type AdminClientProvider,
} from "../middlewares/require-admin";

const MEMBERSHIP_STATES = new Set(["pending", "active", "suspended", "expired"]);
const PAGE_SIZE = 1000;
const MAX_USERS = 100_000;
const administratorBootstrapLocks = new Map<string, Promise<void>>();

// Serializes duplicate bootstrap requests handled by this API process.
async function withAdministratorBootstrapLock<T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = administratorBootstrapLocks.get(userId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  administratorBootstrapLocks.set(userId, queued);

  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (administratorBootstrapLocks.get(userId) === queued) {
      administratorBootstrapLocks.delete(userId);
    }
  }
}

function toAdminMember(user: User) {
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
  const isDesignatedAdmin =
    isDesignatedAdminEmail(user.email) &&
    emailVerified &&
    user.app_metadata["role"] === "admin";
  const status = user.app_metadata["membership_status"];

  return {
    id: user.id,
    email: user.email ?? null,
    emailVerified,
    role: isDesignatedAdmin ? "admin" : "trader",
    membershipStatus: MEMBERSHIP_STATES.has(status) ? status : "pending",
    createdAt: new Date(user.created_at),
    lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
  };
}

function sendError(res: Response, status: number, error: string): void {
  res.status(status).json({ error });
}

async function listAllUsers(
  client: ReturnType<AdminClientProvider>,
): Promise<User[] | null> {
  const users: User[] = [];
  for (let page = 1; page <= MAX_USERS / PAGE_SIZE; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) return null;
    users.push(...data.users);
    if (data.users.length < PAGE_SIZE) return users;
  }
  return null;
}

export function createAdminRouter(
  provideAdminClient: AdminClientProvider = createAdminSupabaseClient,
): IRouter {
  const router: IRouter = Router();
  const requireAdmin = createRequireAdmin(provideAdminClient);
  const requireDesignatedAdminIdentity =
    createRequireDesignatedAdminIdentity(provideAdminClient);

  router.post(
    "/admin/initialize",
    requireDesignatedAdminIdentity,
    async (req: Request, res: Response): Promise<void> => {
      const client = req.adminSupabaseClient;
      const adminUserId = req.adminUserId;
      if (!client || !adminUserId) {
        sendError(res, 401, "Administrator authorization is required.");
        return;
      }

      type InitializeAdminResult =
        | { ok: true; user: User }
        | { ok: false; status: number; message: string };

      const result = await withAdministratorBootstrapLock<InitializeAdminResult>(
        adminUserId,
        async () => {
        const { data: currentResult, error: lookupError } =
          await client.auth.admin.getUserById(adminUserId);
        const currentUser = currentResult.user;
        if (lookupError || !currentUser || currentUser.id !== adminUserId) {
          return {
            ok: false,
            status: 502,
            message: "The administrator account could not be loaded.",
          };
        }

        if (!isVerifiedDesignatedAdmin(currentUser)) {
          return {
            ok: false,
            status: 403,
            message: "Administrator access is restricted.",
          };
        }

        const currentMetadata = currentUser.app_metadata ?? {};
        if (
          currentMetadata["role"] === "admin" &&
          currentMetadata["membership_status"] === "active"
        ) {
          return { ok: true, user: currentUser };
        }

        const { data: updatedResult, error: updateError } =
          await client.auth.admin.updateUserById(adminUserId, {
            app_metadata: {
              ...currentMetadata,
              role: "admin",
              membership_status: "active",
            },
          });
        if (updateError || !updatedResult.user) {
          return {
            ok: false,
            status: 502,
            message: "Administrator access could not be initialized.",
          };
        }

        return { ok: true, user: updatedResult.user };
      },
      );

      if (!result.ok) {
        sendError(res, result.status, result.message);
        return;
      }

      const parsed = InitializeAdminResponse.safeParse(toAdminMember(result.user));
      if (!parsed.success) {
        sendError(res, 502, "Administrator initialization returned invalid data.");
        return;
      }
      res.json(parsed.data);
    },
  );

  router.get("/admin/users", requireAdmin, async (req: Request, res: Response) => {
    const client = req.adminSupabaseClient;
    const adminUserId = req.adminUserId;
    if (!client || !adminUserId) {
      sendError(res, 401, "Administrator authorization is required.");
      return;
    }

    const users = await listAllUsers(client);
    if (!users) {
      sendError(res, 502, "The user directory could not be loaded.");
      return;
    }

    const admin = users.find((user) => user.id === adminUserId);
    if (!admin) {
      sendError(res, 502, "The administrator account could not be loaded.");
      return;
    }

    const parsed = ListAdminUsersResponse.safeParse({
      admin: toAdminMember(admin),
      users: users.map(toAdminMember),
    });
    if (!parsed.success) {
      sendError(res, 502, "The user directory returned invalid data.");
      return;
    }
    res.json(parsed.data);
  });

  router.patch(
    "/admin/users/:userId/membership",
    requireAdmin,
    async (req: Request, res: Response) => {
      const client = req.adminSupabaseClient;
      const adminUserId = req.adminUserId;
      if (!client || !adminUserId) {
        sendError(res, 401, "Administrator authorization is required.");
        return;
      }

      const params = UpdateAdminMembershipParams.safeParse(req.params);
      const body = UpdateAdminMembershipBody.safeParse(req.body);
      if (!params.success || !body.success) {
        sendError(res, 400, "The membership update request is invalid.");
        return;
      }

      const { userId } = params.data;
      if (userId === adminUserId) {
        sendError(res, 403, "The designated administrator's membership cannot be changed here.");
        return;
      }

      const { data: targetResult, error: lookupError } =
        await client.auth.admin.getUserById(userId);
      if (lookupError || !targetResult.user) {
        sendError(res, 404, "The user was not found.");
        return;
      }

      const targetUser = targetResult.user;
      if (isDesignatedAdminEmail(targetUser.email)) {
        sendError(res, 403, "The designated administrator's membership cannot be changed here.");
        return;
      }

      const appMetadata = targetUser.app_metadata ?? {};
      const { data: updatedResult, error: updateError } =
        await client.auth.admin.updateUserById(userId, {
          app_metadata: {
            ...appMetadata,
            role: "trader",
            membership_status: body.data.status,
          },
        });

      if (updateError || !updatedResult.user) {
        sendError(res, 502, "The membership status could not be updated.");
        return;
      }

      const parsed = UpdateAdminMembershipResponse.safeParse({
        user: toAdminMember(updatedResult.user),
        // Supabase's admin API requires a target user's JWT to sign out that
        // user; it does not expose session termination by user ID.
        sessionsTerminated: false,
      });
      if (!parsed.success) {
        sendError(res, 502, "The membership update returned invalid data.");
        return;
      }
      res.json(parsed.data);
    },
  );

  router.post(
    "/admin/users/:userId/terminate-sessions",
    requireAdmin,
    (req: Request, res: Response) => {
      const params = TerminateAdminUserSessionsParams.safeParse(req.params);
      if (!params.success) {
        sendError(res, 400, "The user ID is invalid.");
        return;
      }

      sendError(
        res,
        501,
        "Supabase requires the target user's access token to terminate sessions; it cannot do this by user ID.",
      );
    },
  );

  return router;
}

export default createAdminRouter();
