import React, { useState } from 'react';
import { 
  Compass, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationRoute } from '../types';

interface RegisterPageProps {
  onNavigate: (route: NavigationRoute, hash?: string) => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onNavigate, 
  onOpenPrivacy, 
  onOpenTerms 
}) => {
  const { register, resendVerification, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registration success state
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Email format validation
  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Password strength criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(email, password);

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        // Successful registration: show verification prompt
        setRegisteredEmail(email.trim().toLowerCase());
      }
    } catch {
      setErrorMessage('An unexpected error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || resendCooldown > 0) return;
    setResendStatus(null);
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

    const res = await resendVerification(registeredEmail);
    if (res.error) {
      setResendStatus(`Failed to resend: ${res.error}`);
    } else {
      setResendStatus('A new verification email has been sent. Please check your inbox.');
    }
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-grid-pattern">
      {/* Header bar */}
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
          Already have an account? <span className="text-[#168BFF] underline">Sign in</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#16A36A]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          {registeredEmail ? (
            /* Success State: Check Email for Verification */
            <div className="space-y-6 text-center relative z-10 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-[#E8F2EE]">Check Your Email</h2>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  We sent a secure verification link to:
                </p>
                <div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] font-mono text-xs font-semibold text-[#16A36A] break-all">
                  {registeredEmail}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#101B20]/80 border border-[#1A363E] text-left space-y-2 text-xs text-[#A9BEB5]">
                <div className="flex items-center gap-2 text-[#E8F2EE] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#168BFF]" />
                  <span>Next Steps:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                  <li>Open the email from <strong>PipPilotAi (via Supabase)</strong>.</li>
                  <li>Click the verification link to confirm your ownership.</li>
                  <li>After confirming your email, return and sign in to your portal.</li>
                </ol>
                <div className="pt-2 border-t border-[#1A363E] text-[10px] text-[#E69A36]">
                  <strong>Security notice:</strong> A verified email confirms your identity. Full platform access is activated in subsequent steps following administrator membership review.
                </div>
              </div>

              {resendStatus && (
                <div className="p-3 rounded-xl bg-[#101B20] border border-[#168BFF]/40 text-xs text-[#168BFF]">
                  {resendStatus}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`w-full py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    resendCooldown > 0
                      ? 'bg-[#101B20] text-[#A9BEB5] border-[#1A363E] cursor-not-allowed'
                      : 'bg-[#152B30] hover:bg-[#1B363C] text-[#E8F2EE] border-[#168BFF]/40'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="w-full py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold shadow-md shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-extrabold text-[#E8F2EE]">Create Trader Account</h1>
                <p className="text-xs text-[#A9BEB5]">
                  Register for PipPilotAi trading intelligence access
                </p>
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A9BEB5] hover:text-[#E8F2EE] p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength criteria indicator */}
                <div className="p-2.5 rounded-xl bg-[#101B20]/60 border border-[#1A363E] text-[10px] space-y-1 font-mono">
                  <span className="text-[#A9BEB5] block font-sans font-semibold mb-1">
                    Password requirements:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={hasMinLength ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • At least 8 characters
                    </span>
                    <span className={hasUppercase ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • Uppercase letter
                    </span>
                    <span className={hasNumber ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • Number (0-9)
                    </span>
                    <span className={hasSpecial ? 'text-[#16A36A]' : 'text-[#A9BEB5]'}>
                      • Special character
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
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

              {/* Legal terms disclaimer */}
              <p className="text-[11px] text-[#A9BEB5] leading-relaxed">
                By registering, you agree to the PipPilotAi{' '}
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-[#168BFF] hover:underline inline"
                >
                  Terms and Conditions
                </button>{' '}
                and acknowledge the{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-[#168BFF] hover:underline inline"
                >
                  Privacy Policy
                </button>
                .
              </p>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-sm shadow-lg shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Verify Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Link to Login */}
              <div className="pt-2 border-t border-[#1A363E] text-center text-xs text-[#A9BEB5]">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-[#168BFF] font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
