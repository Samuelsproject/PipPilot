import React, { useState } from 'react';
import { 
  Compass, 
  Mail, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  KeyRound 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationRoute } from '../types';

interface ForgotPasswordPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await sendPasswordReset(email);

      if (res.error && res.error.includes('rate limit')) {
        setErrorMessage(res.error);
      } else {
        // Generic confirmation to avoid user enumeration
        setSubmitted(true);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
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
          onClick={() => onNavigate('/login')}
          className="text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
        >
          Back to Sign in
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-[#152B30] border border-[#168BFF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#168BFF]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          {submitted ? (
            /* Confirmation State */
            <div className="space-y-6 text-center relative z-10 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-[#E8F2EE]">Check Your Inbox</h2>
                <p className="text-xs text-[#A9BEB5] leading-relaxed">
                  If an account matches <strong className="text-[#E8F2EE] font-mono">{email}</strong>, a secure password recovery link has been dispatched.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101B20]/80 border border-[#1A363E] text-left space-y-2 text-xs text-[#A9BEB5]">
                <p className="text-[11px] leading-relaxed">
                  • Click the recovery link in the email to set a new password.<br />
                  • The link expires in 60 minutes for security.<br />
                  • If you do not see the message, verify your spam folder or check spelling.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="w-full py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#168BFF]/15 border border-[#168BFF]/30 text-[#168BFF] flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#E8F2EE]">Reset Password</h1>
                <p className="text-xs text-[#A9BEB5]">
                  Enter your registered email to receive recovery instructions
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

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
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#168BFF] transition-colors font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] font-bold text-sm shadow-lg shadow-[#168BFF]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-[#1A363E] text-center text-xs text-[#A9BEB5]">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-[#A9BEB5] hover:text-[#E8F2EE] flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Remember password? Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
