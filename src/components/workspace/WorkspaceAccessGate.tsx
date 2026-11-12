import React from 'react';
import {
  Compass,
  Lock,
  LogIn,
  UserPlus,
  ArrowLeft,
  ShieldAlert,
  Clock,
  MailCheck,
  HelpCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { NavigationRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface WorkspaceAccessGateProps {
  mode: 'unauthenticated' | 'unverified';
  attemptedRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
}

export const WorkspaceAccessGate: React.FC<WorkspaceAccessGateProps> = ({
  mode,
  attemptedRoute,
  onNavigate,
}) => {
  const { user, logout, isConfigured } = useAuth();

  const handleSignOut = async () => {
    await logout();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-grid-pattern">
      {/* Top Bar */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#152B30] bg-[#101B20]/90">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
            <div className="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#16A36A]" />
            </div>
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#E8F2EE]">
            PipPilot<span className="text-[#16A36A]">Ai</span>
          </span>
        </button>

        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Homepage</span>
        </button>
      </header>

      {/* Main Guard Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#168BFF]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-5 text-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                mode === 'unauthenticated'
                  ? 'bg-[#168BFF]/15 border-[#168BFF]/40 text-[#168BFF]'
                  : 'bg-[#E69A36]/15 border-[#E69A36]/40 text-[#E69A36]'
              }`}
            >
              {mode === 'unauthenticated' ? (
                <Lock className="w-7 h-7" />
              ) : (
                <MailCheck className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#101B20] border border-[#1A363E] text-[#168BFF]">
                Protected Workspace · {attemptedRoute}
              </span>
              <h1 className="text-2xl font-extrabold text-[#E8F2EE] purple-glow-text">
                {mode === 'unauthenticated'
                  ? 'Authentication Required'
                  : 'Email Verification Required'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A9BEB5] leading-relaxed">
                {mode === 'unauthenticated'
                  ? 'The PipPilotAi trading workspace is restricted to authenticated members. Please sign in or request platform access to continue.'
                  : `Your account (${user?.email}) has not verified its email address yet. Verify your email before entering the workspace.`}
              </p>
            </div>

            {!isConfigured && mode === 'unauthenticated' && (
              <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#E69A36]/40 text-left text-xs text-[#A9BEB5] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5" />
                <span>
                  Supabase environment credentials are not configured in this environment, so authenticated sessions cannot be created until{' '}
                  <code className="font-mono text-[#E8F2EE]">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono text-[#E8F2EE]">VITE_SUPABASE_ANON_KEY</code> are provided.
                </span>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              {mode === 'unauthenticated' ? (
                <>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-sm shadow-lg shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Workspace</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="w-full py-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] text-[#E8F2EE] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-[#168BFF]" />
                    <span>Get Access / Register</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('/verify-email')}
                    className="w-full py-3.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <MailCheck className="w-4 h-4" />
                    <span>Verify Email Address</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#E05252]/30 text-[#E05252] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}

              <button
                onClick={() => onNavigate('/')}
                className="w-full py-2.5 text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Marketing Page</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface PendingApprovalGuardProps {
  featureName: string;
  onNavigate: (route: NavigationRoute) => void;
}

export const PendingApprovalGuard: React.FC<PendingApprovalGuardProps> = ({
  featureName,
  onNavigate,
}) => {
  const { user, userRole } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-8 px-2">
      <div className="bg-[#152B30] border border-[#9560E8]/40 rounded-2xl p-6 sm:p-8 purple-glow-box space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#E69A36]/15 text-[#E69A36] border border-[#E69A36]/30">
            <Clock className="w-3.5 h-3.5" />
            MEMBERSHIP PENDING APPROVAL
          </span>
          <span className="text-[11px] font-mono text-[#A9BEB5]">
            Role: <strong className="text-[#E8F2EE] uppercase">{userRole}</strong>
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#E8F2EE] purple-glow-text">
            {featureName} Requires Approved Membership
          </h2>
          <p className="text-xs sm:text-sm text-[#A9BEB5] leading-relaxed">
            Your email (<span className="font-mono text-[#E8F2EE]">{user?.email}</span>) is verified, confirming identity (Onboarding Step 2). Protected trading modules are unlocked only after administrator cohort approval (Onboarding Step 3).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
            <span className="font-mono text-[#16A36A] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Identity Verified
            </span>
            <p className="text-[11px] text-[#A9BEB5]">
              Supabase authentication and email verification are active for your profile.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
            <span className="font-mono text-[#9560E8] font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Access Separation Enforced
            </span>
            <p className="text-[11px] text-[#A9BEB5]">
              Pending trader accounts cannot access protected trading, strategy, or execution features.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onNavigate('/app')}
            className="flex-1 py-3 px-4 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <span>Return to Dashboard Overview</span>
          </button>
          <button
            onClick={() => onNavigate('/app/support')}
            className="flex-1 py-3 px-4 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] text-[#E8F2EE] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-[#168BFF]" />
            <span>Help and Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};
