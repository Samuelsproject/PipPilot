import type { NextFunction, Request, Response } from "express";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AdminSupabaseConfigError,
  createAdminSupabaseClient,
} from "../lib/admin-supabase";

export type MembershipStatus = "pending" | "active" | "suspended" | "expired";
export type MembershipClientProvider = () => SupabaseClient;

declare global {
  namespace Express {
    interface Request {
      membershipUser?: User;
    }
  }
}

function normalizeMembershipStatus(value: unknown): MembershipStatus {
  if (value === "active" || value === "suspended" || value === "expired") {
    return value;
  }
  return "pending";
}

function getMembershipDenial(status: MembershipStatus) {
  switch (status) {
    case "pending":
      return {
        code: "MEMBERSHIP_PENDING",
        error: "Membership is waiting for administrator approval.",
      };
    case "suspended":
      return {
        code: "MEMBERSHIP_SUSPENDED",
        error: "Membership is suspended. Contact support for help.",
      };
    case "expired":
      return {
        code: "MEMBERSHIP_REVOKED",
        error: "Membership access has been revoked. Contact support for help.",
      };
    case "active":
      return null;
  }
}

export function createRequireApprovedMembership(
  provideClient: MembershipClientProvider = createAdminSupabaseClient,
) {
  return async function requireApprovedMembership(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      res.status(401).json({
        code: "AUTH_REQUIRED",
        error: "A valid bearer access token is required.",
      });
      return;
    }

    let client: SupabaseClient;
    try {
      client = provideClient();
    } catch (error) {
      if (error instanceof AdminSupabaseConfigError) {
        res.status(503).json({
          code: "MEMBERSHIP_CHECK_UNAVAILABLE",
          error: "Membership access could not be verified.",
        });
        return;
      }
      next(error);
      return;
    }

    let user: User | null;
    try {
      const result = await client.auth.getUser(token);
      user = result.error ? null : result.data.user;
    } catch {
      res.status(503).json({
        code: "MEMBERSHIP_CHECK_UNAVAILABLE",
        error: "Membership access could not be verified.",
      });
      return;
    }

    if (!user) {
      res.status(401).json({
        code: "INVALID_TOKEN",
        error: "The access token is invalid or expired.",
      });
      return;
    }

    if (!(user.email_confirmed_at || user.confirmed_at)) {
      res.status(403).json({
        code: "EMAIL_UNVERIFIED",
        error: "Verify your email address before entering the workspace.",
        membershipStatus: normalizeMembershipStatus(
          user.app_metadata["membership_status"],
        ),
      });
      return;
    }

    const membershipStatus = normalizeMembershipStatus(
      user.app_metadata["membership_status"],
    );
    const denial = getMembershipDenial(membershipStatus);
    if (denial) {
      res.status(403).json({ ...denial, membershipStatus });
      return;
    }

    req.membershipUser = user;
    next();
  };
}
