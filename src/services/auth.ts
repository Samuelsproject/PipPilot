import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: string | null;
  requiresEmailVerification?: boolean;
}

export const getRedirectUrl = (path: string = ''): string => {
  const origin = window.location.origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

/**
 * Standardize Supabase error messages into clean, actionable guidance
 */
export const formatAuthErrorMessage = (error: AuthError | Error | unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const message = (error as { message?: string }).message || String(error);

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Your email address has not been verified yet. Please check your inbox and click the verification link.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email address already exists. Please sign in or use password recovery.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password is too short. It must contain at least 8 characters.';
  }
  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
    return 'Too many email requests sent recently. Please wait a few minutes before trying again.';
  }
  if (message.includes('Token has expired or is invalid')) {
    return 'This verification or recovery link has expired or has already been used. Please request a new one.';
  }
  if (message.includes('Auth session missing')) {
    return 'Your session has expired. Please request a new password recovery link.';
  }
  return message;
};

/**
 * Register a new trader account with email & password
 */
export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResponse<{ user: User | null; session: Session | null }>> => {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
    };
  }

  try {
    const redirectUrl = getRedirectUrl('/verify-email');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          registered_at: new Date().toISOString(),
          platform: 'pippilot_web',
        },
      },
    });

    if (error) {
      return { data: null, error: formatAuthErrorMessage(error) };
    }

    // Check if email confirmation is required
    const requiresVerification = !data.session && !data.user?.email_confirmed_at;

    return {
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
      requiresEmailVerification: requiresVerification,
    };
  } catch (err) {
    return { data: null, error: formatAuthErrorMessage(err) };
  }
};

/**
 * Sign in with email and password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse<{ user: User; session: Session }>> => {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const isUnconfirmed = 
        error.message.includes('Email not confirmed') || 
        error.status === 400 && error.message.toLowerCase().includes('confirm');
      
      return { 
        data: null, 
        error: formatAuthErrorMessage(error),
        requiresEmailVerification: isUnconfirmed 
      };
    }

    if (!data.user || !data.session) {
      return { data: null, error: 'Failed to retrieve authenticated session.' };
    }

    return {
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: formatAuthErrorMessage(err) };
  }
};

/**
 * Sign out the current user and clear local auth tokens
 */
export const logoutUser = async (): Promise<AuthResponse<null>> => {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { data: null, error: formatAuthErrorMessage(error) };
    }
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: formatAuthErrorMessage(err) };
  }
};

/**
 * Send password reset email
 * Note: generic response prevents email enumeration
 */
export const requestPasswordReset = async (
  email: string
): Promise<AuthResponse<null>> => {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
    };
  }

  try {
    const redirectUrl = getRedirectUrl('/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: redirectUrl,
      }
    );

    if (error) {
      // Don't leak whether the email exists, but return error for rate limiting
      if (error.message.includes('rate limit')) {
        return { data: null, error: formatAuthErrorMessage(error) };
      }
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: formatAuthErrorMessage(err) };
  }
};

/**
 * Update user password after recovery link verification
 */
export const updateUserPassword = async (
  newPassword: string
): Promise<AuthResponse<User>> => {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: 'Supabase is not configured.',
    };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { data: null, error: formatAuthErrorMessage(error) };
    }

    return { data: data.user, error: null };
  } catch (err) {
    return { data: null, error: formatAuthErrorMessage(err) };
  }
};

/**
 * Resend verification email for unconfirmed accounts
 */
export const resendVerificationEmail = async (
  email: string
): Promise<AuthResponse<null>> => {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: 'Supabase is not configured.',
    };
  }

  try {
    const redirectUrl = getRedirectUrl('/verify-email');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { data: null, error: formatAuthErrorMessage(error) };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: formatAuthErrorMessage(err) };
  }
};
