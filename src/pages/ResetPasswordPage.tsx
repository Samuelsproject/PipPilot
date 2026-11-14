import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  KeyRound, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationRoute } from '../types';

interface ResetPasswordPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { updatePassword, session, isLoading: authLoading, isRecoverySession } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if session or recovery tokens are present
  const [linkValid, setLinkValid] = useState<boolean | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hasCallbackError =
      search.has('error') || search.has('error_code') || search.has('error_description') ||
      hash.has('error') || hash.has('error_code') || hash.has('error_description');
    const hasRecoveryCallback =
      search.get('type') === 'recovery' ||
      hash.get('type') === 'recovery' ||
      search.has('code') ||
      (hash.has('access_token') && hash.get('type') === 'recovery');

    if (hasCallbackError) {
      setLinkValid(false);
      setErrorMessage('The password recovery link has expired or has already been used. Please request a new link.');
      return;
    }

    if (isRecoverySession && session) {
      setLinkValid(true);
      return;
    }

    if (hasRecoveryCallback && session) {
      setLinkValid(true);
      return;
    }

    if (!authLoading) {
      if (!hasRecoveryCallback) {
        setLinkValid(false);
        setErrorMessage('Open a valid password recovery link to continue. You can request a new link below.');
      } else {
        const timeout = window.setTimeout(() => {
          setLinkValid(false);
          setErrorMessage('This password recovery link is expired or invalid. Please request a new one.');
        }, 3000);
        return () => window.clearTimeout(timeout);
      }
    }
  }, [authLoading, isRecoverySession, session]);

  // Password strength requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPasswordStrong) {
      setErrorMessage('New password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await updatePassword(password);

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMessage('Failed to update password. Please ensure your recovery link is still active and try again.');
    } finally {
      setLoading(false);
    }
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
          Back to Sign In
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#16A36A]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          {success ? (
            /* Success State */
            <div className="space-y-6 text-center relative z-10 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-[#E8F2EE]">PipPilotAi password updated</h2>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  Your PipPilotAi password has been securely updated. You can now sign in with your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#16A36A]/25"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : linkValid === false ? (
            /* Expired / Invalid Link State */
            <div className="space-y-6 text-center relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#E05252]/20 border border-[#E05252]/40 text-[#E05252] flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-[#E8F2EE]">PipPilotAi recovery link expired</h2>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  This recovery token is invalid or has already been consumed. For your security, password links are single-use and time-limited.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="w-full py-3.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>Request New Password Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : linkValid === null ? (
            <div role="status" className="relative z-10 py-8 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#16A36A] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#E8F2EE]">Checking recovery link</p>
              <p className="text-xs text-[#A9BEB5]">Verifying your secure sign-in session before allowing a password change.</p>
            </div>
          ) : (
            /* Set New Password Form */
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#16A36A]/15 border border-[#16A36A]/30 text-[#16A36A] flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#E8F2EE]">Choose a new PipPilotAi password</h1>
                <p className="text-xs text-[#A9BEB5]">
                  Enter and confirm your new secure password
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    aria-label="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A9BEB5] hover:text-[#E8F2EE] p-1"
                    aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-[#101B20]/60 border border-[#1A363E] text-[10px] space-y-1 font-mono">
                  <div className="grid grid-cols-2 gap-1">
                    <span className={hasMinLength ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • 8+ characters
                    </span>
                    <span className={hasUppercase ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • Uppercase
                    </span>
                    <span className={hasNumber ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • Number (0-9)
                    </span>
                    <span className={hasSpecial ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • Special symbol
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    aria-label="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A9BEB5] hover:text-[#E8F2EE] p-1"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] font-mono ${passwordsMatch ? 'text-[#16A36A]' : 'text-[#E05252]'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-sm shadow-lg shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
