import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Mail, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationRoute } from '../types';

interface VerifyEmailPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const { user, emailVerified, resendVerification, refreshSession } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL hash for error or access token from Supabase verification
  const [hashStatus, setHashStatus] = useState<'success' | 'error' | 'pending'>('pending');

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    if (hash.includes('error=') || search.includes('error=')) {
      setHashStatus('error');
      setErrorMessage('The email verification link has expired or is invalid. Please request a new verification email.');
    } else if (emailVerified || hash.includes('type=signup') || hash.includes('access_token=')) {
      setHashStatus('success');
      refreshSession();
    } else {
      setHashStatus('pending');
    }
  }, [emailVerified]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (user?.email || emailInput).trim().toLowerCase();
    if (!targetEmail) {
      setErrorMessage('Please enter your email address to resend verification.');
      return;
    }

    setResending(true);
    setResendNotice(null);
    setErrorMessage(null);
    setResendCooldown(60);

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const res = await resendVerification(targetEmail);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setResendNotice(`A fresh verification email was sent to ${targetEmail}. Please check your inbox and spam folder.`);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-grid-pattern">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#152B30]">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group text-left focus:outline-none"
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
          onClick={() => onNavigate('/login')}
          className="text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
        >
          Go to Sign In
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#16A36A]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          {hashStatus === 'success' ? (
            /* Successful Email Verification */
            <div className="space-y-6 text-center relative z-10 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-[#E8F2EE]">Email Address Verified!</h1>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  Your PipPilotAi trader account email has been successfully confirmed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101B20]/80 border border-[#1A363E] text-left space-y-2 text-xs text-[#A9BEB5]">
                <div className="flex items-center gap-2 text-[#E8F2EE] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                  <span>Onboarding Status: Step 2 of 5 Complete</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Now that your email is verified, sign in to your dashboard to review initial platform tools and request cohort membership approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-xs shadow-lg shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In to PipPilotAi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : hashStatus === 'error' ? (
            /* Expired / Invalid Verification Link */
            <div className="space-y-6 text-center relative z-10 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#E05252]/20 border border-[#E05252]/40 text-[#E05252] flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-[#E8F2EE]">Verification Link Expired</h2>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  {errorMessage || 'This verification link is invalid or has already been used.'}
                </p>
              </div>

              {/* Resend Form */}
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Enter your email to receive a new link:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#168BFF] transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resending || resendCooldown > 0}
                  className="w-full py-3 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Verification Email'}
                  </span>
                </button>
              </form>

              {resendNotice && (
                <div className="p-3 rounded-xl bg-[#101B20] border border-[#16A36A]/40 text-xs text-[#16A36A]">
                  {resendNotice}
                </div>
              )}
            </div>
          ) : (
            /* Pending Verification Instructions & Resend Tool */
            <div className="space-y-6 relative z-10">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#E8F2EE]">Verify Your Email</h1>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  Before signing in, verify your email address by clicking the link sent to your inbox.
                </p>
              </div>

              {resendNotice && (
                <div className="p-3 rounded-xl bg-[#101B20] border border-[#16A36A]/40 text-xs text-[#16A36A] animate-in fade-in duration-200">
                  {resendNotice}
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Need another verification link? Enter email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput || user?.email || ''}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#168BFF] transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resending || resendCooldown > 0}
                  className="w-full py-3 rounded-xl bg-[#152B30] hover:bg-[#1B363C] border border-[#168BFF]/40 text-[#E8F2EE] font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Email'}
                  </span>
                </button>
              </form>

              <div className="pt-2 border-t border-[#1A363E] text-center text-xs text-[#A9BEB5]">
                <span>Already verified? </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-[#16A36A] font-semibold hover:underline"
                >
                  Sign in to your account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
