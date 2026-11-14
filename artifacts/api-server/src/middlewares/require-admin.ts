import type { NextFunction, Request, Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AdminSupabaseConfigError,
  createAdminSupabaseClient,
  DESIGNATED_ADMIN_EMAIL,
} from "../lib/admin-supabase";

declare global {
  namespace Express {
    interface Request {
      adminSupabaseClient?: SupabaseClient;
      adminUserId?: string;
    }
  }
}

export type AdminClientProvider = () => SupabaseClient;

export function createRequireAdmin(
  provideAdminClient: AdminClientProvider = createAdminSupabaseClient,
) {
  return async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authorization = req.get("authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      res.status(401).json({ error: "A valid bearer access token is required." });
      return;
    }

    let client: SupabaseClient;
    try {
      client = provideAdminClient();
    } catch (error) {
      if (error instanceof AdminSupabaseConfigError) {
        res.status(503).json({ error: "Administrative service is not configured." });
        return;
      }
      next(error);
      return;
    }

    try {
      const { data, error } = await client.auth.getUser(token);
      const user = data.user;
      if (error || !user) {
        res.status(401).json({ error: "The access token is invalid or expired." });
        return;
      }

      const isVerifiedDesignatedAdmin =
        user.email?.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL &&
        Boolean(user.email_confirmed_at || user.confirmed_at);

      if (!isVerifiedDesignatedAdmin) {
        res.status(403).json({ error: "Administrator access is restricted." });
        return;
      }

      const currentMetadata = user.app_metadata ?? {};
      if (
        currentMetadata["role"] !== "admin" ||
        currentMetadata["membership_status"] !== "active"
      ) {
        const { error: updateError } = await client.auth.admin.updateUserById(
          user.id,
          {
            app_metadata: {
              ...currentMetadata,
              role: "admin",
              membership_status: "active",
            },
          },
        );

        if (updateError) {
          res.status(503).json({ error: "Administrator authorization could not be initialized." });
          return;
        }
      }

      req.adminSupabaseClient = client;
      req.adminUserId = user.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}
