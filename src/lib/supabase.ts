import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Verify valid format: not empty and not default placeholder
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-ref') && 
  !supabaseAnonKey.includes('your-supabase-anon-public-key') &&
  supabaseUrl.startsWith('https://')
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'pippilot_auth_token',
    },
  });
} else {
  // Fallback dummy client to prevent runtime crash while signaling unconfigured status
  client = createClient(
    'https://placeholder-project.supabase.co',
    'placeholder-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export const supabase = client;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => ({
  isConfigured: isSupabaseConfigured,
  hasUrl: Boolean(supabaseUrl && !supabaseUrl.includes('your-project-ref')),
  hasKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-supabase-anon-public-key')),
});
