import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  requestPasswordReset, 
  updateUserPassword, 
  resendVerificationEmail,
  AuthResponse 
} from '../services/auth';
import { MembershipApprovalStatus, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  emailVerified: boolean;
  membershipStatus: MembershipApprovalStatus;
  userRole: UserRole;
  isApproved: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse<{ user: User; session: Session }>>;
  register: (email: string, password: string) => Promise<AuthResponse<{ user: User | null; session: Session | null }>>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<AuthResponse<null>>;
  updatePassword: (password: string) => Promise<AuthResponse<User>>;
  resendVerification: (email: string) => Promise<AuthResponse<null>>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Membership access separation:
  // Email verification confirms identity; administrator approval is stored in server-controlled app_metadata.
  // Pending users must not gain premium trading access; admin role remains separate from ordinary users.
  const emailVerified = Boolean(user && user.email_confirmed_at);
  const userRole: UserRole = useMemo(() => {
    if (user?.app_metadata?.role === 'admin') return 'admin';
    return 'trader';
  }, [user]);

  const membershipStatus: MembershipApprovalStatus = useMemo(() => {
    if (!user) return 'none';
    if (!emailVerified) return 'none';
    if (user.app_metadata?.membership_status === 'active') return 'active';
    return 'pending_approval';
  }, [user, emailVerified]);

  const isApproved = membershipStatus === 'active';
  const isAdmin = userRole === 'admin';

  const refreshSession = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    } catch {
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        // If the user arrived via a password recovery email link, handle navigation
        if (event === 'PASSWORD_RECOVERY') {
          // Dispatched when the password recovery token is parsed
          window.dispatchEvent(new CustomEvent('pippilot:password_recovery'));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    if (res.data?.session) {
      setSession(res.data.session);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (email: string, password: string) => {
    return await registerUser(email, password);
  };

  const logout = async () => {
    await logoutUser();
    setSession(null);
    setUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    return await requestPasswordReset(email);
  };

  const updatePassword = async (password: string) => {
    return await updateUserPassword(password);
  };

  const resendVerification = async (email: string) => {
    return await resendVerificationEmail(email);
  };

  const value = {
    user,
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    emailVerified,
    membershipStatus,
    userRole,
    isApproved,
    isAdmin,
    login,
    register,
    logout,
    sendPasswordReset,
    updatePassword,
    resendVerification,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
