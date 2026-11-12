import React, { useState } from 'react';
import { 
  Compass, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert, 
  Send 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationRoute } from '../types';

interface LoginPageProps {
  onNavigate: (route: NavigationRoute, hash?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, resendVerification } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unconfirmed email special state
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRequiresVerification(false);
    setResendNotice(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(email, password);

      if (res.error) {
        setErrorMessage(res.error);
        if (res.requiresEmailVerification) {
          setRequiresVerification(true);
        }
      } else {
        // Successful login: navigate to dashboard
        onNavigate('/app');
      }
    } catch {
      setErrorMessage('Failed to sign in. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResending(true);
    setResendNotice(null);

    const res = await resendVerification(email);
    if (res.error) {
      setResendNotice(`Failed to send verification email: ${res.error}`);
    } else {
      setResendNotice('Verification email resent successfully! Please check your inbox and spam folder.');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-grid-pattern">
      {/* Header Bar */}
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
          onClick={() => onNavigate('/')}
          className="text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
        >
          Back to Homepage
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#168BFF]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="text-center space-y-1 relative z-10">
            <h1 className="text-2xl font-extrabold text-[#E8F2EE]">Sign In to PipPilotAi</h1>
            <p className="text-xs text-[#A9BEB5]">
              Access your trading intelligence workspace
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] flex items-start gap-2.5 relative z-10 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="leading-relaxed">{errorMessage}</p>
                {requiresVerification && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-[11px] font-bold text-[#168BFF] hover:underline flex items-center gap-1 mt-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{resending ? 'Sending...' : 'Click here to resend verification email'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resend Notice */}
          {resendNotice && (
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#168BFF]/40 text-xs text-[#168BFF] relative z-10 animate-in fade-in duration-200">
              {resendNotice}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#E8F2EE]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-xs text-[#168BFF] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-sm shadow-lg shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 pt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Links */}
            <div className="pt-4 border-t border-[#1A363E] text-center text-xs text-[#A9BEB5] space-y-2">
              <div>
                <span>Need an account? </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="text-[#16A36A] font-semibold hover:underline"
                >
                  Register here
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('/verify-email')}
                  className="text-[11px] text-[#A9BEB5] hover:text-[#168BFF] transition-colors"
                >
                  Having trouble with email verification? Click here
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
