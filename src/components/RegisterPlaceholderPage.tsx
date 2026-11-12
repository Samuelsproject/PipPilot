import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  Mail, 
  Lock, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Activity 
} from 'lucide-react';
import { NavigationRoute } from '../types';

interface RegisterPlaceholderPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const RegisterPlaceholderPage: React.FC<RegisterPlaceholderPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Notice */}
      <div className="bg-[#152B30] border-b border-[#1A363E] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#A9BEB5]">
            <Lock className="w-3.5 h-3.5 text-[#16A36A]" />
            <span>
              <strong>Registration Destination Placeholder</strong> • Stage 3 Implementation
            </span>
          </div>
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 font-bold text-[#16A36A] hover:text-[#E8F2EE] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-10 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A36A]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Brand header */}
          <div className="text-center space-y-3 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
              <div className="w-full h-full bg-[#101B20] rounded-[14px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#16A36A]" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E8F2EE]">
              PipPilot<span className="text-[#16A36A]">Ai</span> Platform Access
            </h1>

            <p className="text-xs sm:text-sm text-[#A9BEB5] leading-relaxed">
              Future Authentication & Registration Destination. In accordance with platform governance, all access requests undergo manual administrator verification.
            </p>
          </div>

          {/* Membership Process Highlights */}
          <div className="bg-[#101B20]/80 rounded-2xl p-4 border border-[#1A363E] space-y-3 relative z-10 text-xs text-[#A9BEB5]">
            <h4 className="font-bold text-[#E8F2EE] text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
              Controlled Access Protocol
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[#16A36A] font-bold">1.</span>
                <span>Account creation & application submission.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[#168BFF] font-bold">2.</span>
                <span>External payment verification by administrator.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[#9560E8] font-bold">3.</span>
                <span>Manual member approval & credential issuance.</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1A363E] text-[11px] text-[#A9BEB5] italic">
              Notice: Full authentication, payment checkouts, and backend user databases are scheduled for subsequent development phases.
            </div>
          </div>

          {/* Notification / Interest Form */}
          <div className="relative z-10">
            {submitted ? (
              <div className="text-center p-6 bg-[#101B20] border border-[#16A36A]/40 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#16A36A]/20 text-[#16A36A] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#E8F2EE]">Notification Request Saved</h3>
                <p className="text-xs text-[#A9BEB5]">
                  We have logged your email (<span className="text-[#E8F2EE] font-mono">{email}</span>). When live registration and admin approvals activate, you will receive invitation instructions.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => onNavigate('/')}
                    className="px-4 py-2 rounded-xl bg-[#152B30] text-xs font-semibold text-[#E8F2EE] hover:bg-[#1A363E] transition-colors"
                  >
                    Return Home
                  </button>
                  <button
                    onClick={() => onNavigate('/app')}
                    className="px-4 py-2 rounded-xl bg-[#168BFF] text-xs font-bold text-[#E8F2EE] hover:bg-[#147bdc] transition-colors flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>View Dashboard Demo</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs font-medium text-[#E8F2EE]">
                  Enter your email for the next onboarding cohort notification:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-[#A9BEB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trader@example.com"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm focus:outline-none focus:border-[#16A36A] transition-colors font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold shadow-md shadow-[#16A36A]/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Submit Inquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-[#1A363E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A9BEB5] relative z-10">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-[#E8F2EE] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Homepage</span>
            </button>
            <button
              onClick={() => onNavigate('/app')}
              className="text-[#168BFF] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Explore Interactive Dashboard Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
