import { Router, type IRouter, type Request, type Response } from "express";
import {
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
} from "../lib/admin-supabase";
import {
  createRequireAdmin,
  type AdminClientProvider,
} from "../middlewares/require-admin";

const MEMBERSHIP_STATES = new Set(["pending", "active", "suspended", "expired"]);
const PAGE_SIZE = 1000;
const MAX_USERS = 100_000;

function toAdminMember(user: User) {
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
  const isDesignatedAdmin =
    user.email?.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL &&
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
        sendError(res, 400, "The administrator's own membership cannot be changed here.");
        return;
      }

      const { data: targetResult, error: lookupError } =
        await client.auth.admin.getUserById(userId);
      if (lookupError || !targetResult.user) {
        sendError(res, 404, "The user was not found.");
        return;
      }

      const targetUser = targetResult.user;
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
