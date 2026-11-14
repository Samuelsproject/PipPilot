import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DESIGNATED_ADMIN_EMAIL = "pippilotaiadmin@gmail.com";

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
