import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Please enter your email address.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Please enter a valid email address.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.';
  }
  return null;
};

/**
 * Map provider errors to safe user-facing messages without leaking project details.
 */
export const formatAuthErrorMessage = (error: AuthError | Error | unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const message = ((error as { message?: string }).message || String(error)).toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Your email address has not been verified yet. Please check your inbox and click the verification link.';
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'We could not create an account with those details. If you already registered, sign in or reset your password.';
  }
  if (message.includes('password should be at least') || message.includes('weak_password')) {
    return 'Password is too short. It must contain at least 8 characters.';
  }
  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit') || message.includes('too many requests')) {
    return 'Too many email requests sent recently. Please wait a few minutes before trying again.';
  }
  if (message.includes('token has expired') || message.includes('otp_expired') || message.includes('invalid token')) {
    return 'This link has expired or is invalid. Please request a new one.';
  }
  if (message.includes('auth session missing') || message.includes('session_not_found')) {
    return 'Your session has expired. Please request a new password recovery link.';
  }
  if (message.includes('invalid email') || message.includes('email address')) {
    return 'Please check the email address and try again.';
  }
  return 'We could not complete that request. Please try again. If the problem continues, contact support.';
};

/**
 * Register a new trader account with email & password
 */
export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResponse<{ user: User | null; session: Session | null }>> => {
  const emailError = validateEmail(email);
  if (emailError) return { data: null, error: emailError };
  const passwordError = validatePassword(password);
  if (passwordError) return { data: null, error: passwordError };

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

    // Registration always returns the user to the sign-in flow. If confirmation
    // is disabled in Supabase, clear the newly created local session as well.
    if (data.session) {
      await supabase.auth.signOut({ scope: 'local' });
    }

    const requiresVerification = !data.user?.email_confirmed_at;

    return {
      data: {
        user: data.user,
        session: null,
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
  const emailError = validateEmail(email);
  if (emailError) return { data: null, error: emailError };
  if (!password) return { data: null, error: 'Please enter your password.' };

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
    const { error } = await supabase.auth.signOut({ scope: 'local' });
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
  const emailError = validateEmail(email);
  if (emailError) return { data: null, error: emailError };

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
  const passwordError = validatePassword(newPassword);
  if (passwordError) return { data: null, error: passwordError };

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
  const emailError = validateEmail(email);
  if (emailError) return { data: null, error: emailError };

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
