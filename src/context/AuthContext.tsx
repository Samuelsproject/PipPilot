import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  isDesignatedAdmin: boolean;
  isRecoverySession: boolean;
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
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const authRevision = useRef(0);

  const clearRecoveryMarker = () => {
    try {
      window.sessionStorage.removeItem('pippilot:recovery-session');
    } catch {
      // Storage may be unavailable in private browsing; the in-memory state remains authoritative.
    }
    setIsRecoverySession(false);
  };

  // Membership access separation:
  // Email verification confirms identity; administrator approval is stored in server-controlled app_metadata.
  // Pending users must not gain premium trading access; admin role remains separate from ordinary users.
  const emailVerified = Boolean(user && user.email_confirmed_at);
  const isDesignatedAdmin = Boolean(
    user?.email?.trim().toLowerCase() === 'pippilotaiadmin@gmail.com' && emailVerified,
  );
  const userRole: UserRole = useMemo(() => {
    if (isDesignatedAdmin && user?.app_metadata?.role === 'admin') return 'admin';
    return 'trader';
  }, [user, isDesignatedAdmin]);

  const membershipStatus: MembershipApprovalStatus = useMemo(() => {
    const value = user?.app_metadata?.membership_status;
    if (value === 'active' || value === 'suspended' || value === 'expired') return value;
    return 'pending';
  }, [user, emailVerified]);

  const isApproved = membershipStatus === 'active';
  const isAdmin = isDesignatedAdmin && userRole === 'admin';

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        try {
          setIsRecoverySession(window.sessionStorage.getItem('pippilot:recovery-session') === '1');
        } catch {
          setIsRecoverySession(false);
        }
      } else {
        clearRecoveryMarker();
      }
    } catch {
      setSession(null);
      setUser(null);
      clearRecoveryMarker();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        authRevision.current += 1;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoverySession(true);
          try {
            window.sessionStorage.setItem('pippilot:recovery-session', '1');
          } catch {
            // Keep the current tab working if browser storage is unavailable.
          }
          window.dispatchEvent(new CustomEvent('pippilot:password_recovery'));
        } else if (event === 'SIGNED_OUT' || !newSession) {
          clearRecoveryMarker();
        }
      }
    );

    const initialRevision = authRevision.current;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted || authRevision.current !== initialRevision) return;
      const currentSession = error ? null : data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        try {
          setIsRecoverySession(window.sessionStorage.getItem('pippilot:recovery-session') === '1');
        } catch {
          setIsRecoverySession(false);
        }
      }
      setIsLoading(false);
    }).catch(() => {
      if (!mounted || authRevision.current !== initialRevision) return;
      setSession(null);
      setUser(null);
      clearRecoveryMarker();
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    if (res.data?.session) {
      setSession(res.data.session);
      setUser(res.data.user);
      clearRecoveryMarker();
    }
    return res;
  };

  const register = async (email: string, password: string) => {
    return await registerUser(email, password);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setSession(null);
      setUser(null);
      clearRecoveryMarker();
    }
  };

  const sendPasswordReset = async (email: string) => {
    return await requestPasswordReset(email);
  };

  const updatePassword = async (password: string) => {
    const result = await updateUserPassword(password);
    if (!result.error) {
      try {
        await logoutUser();
      } finally {
        setSession(null);
        setUser(null);
        clearRecoveryMarker();
      }
    }
    return result;
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
    isDesignatedAdmin,
    isRecoverySession,
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
