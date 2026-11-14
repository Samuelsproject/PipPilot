import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export const DESIGNATED_ADMIN_EMAIL = "pippilotaiadmin@gmail.com";

export function isDesignatedAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL;
}

export function isVerifiedDesignatedAdmin(
  user: Pick<User, "email" | "email_confirmed_at" | "confirmed_at">,
): boolean {
  return (
    isDesignatedAdminEmail(user.email) &&
    Boolean(user.email_confirmed_at || user.confirmed_at)
  );
}

export class AdminSupabaseConfigError extends Error {
  constructor() {
    super("Server-side Supabase administrator credentials are not configured.");
    this.name = "AdminSupabaseConfigError";
  }
}

export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"]?.trim();
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();

  if (!url || !serviceRoleKey) {
    throw new AdminSupabaseConfigError();
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
