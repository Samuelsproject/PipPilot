import type { NextFunction, Request, Response } from "express";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AdminSupabaseConfigError,
  createAdminSupabaseClient,
  isVerifiedDesignatedAdmin,
} from "../lib/admin-supabase";

declare global {
  namespace Express {
    interface Request {
      adminSupabaseClient?: SupabaseClient;
      adminUserId?: string;
      authenticatedAdminUser?: User;
    }
  }
}

export type AdminClientProvider = () => SupabaseClient;

export function createRequireDesignatedAdminIdentity(
  provideAdminClient: AdminClientProvider = createAdminSupabaseClient,
) {
  return async function requireDesignatedAdminIdentity(
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

      if (!isVerifiedDesignatedAdmin(user)) {
        res.status(403).json({ error: "Administrator access is restricted." });
        return;
      }

      req.adminSupabaseClient = client;
      req.adminUserId = user.id;
      req.authenticatedAdminUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createRequireAdmin(
  provideAdminClient: AdminClientProvider = createAdminSupabaseClient,
) {
  const requireDesignatedAdminIdentity =
    createRequireDesignatedAdminIdentity(provideAdminClient);

  return function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    return requireDesignatedAdminIdentity(req, res, () => {
      const metadata = req.authenticatedAdminUser?.app_metadata ?? {};
      if (metadata["role"] !== "admin" || metadata["membership_status"] !== "active") {
        res.status(403).json({
          error: "Administrator access must be initialized before use.",
        });
        return;
      }
      next();
    });
  };
}
