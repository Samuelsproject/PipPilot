import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, UserCheck, Lock } from 'lucide-react';
import { NavigationRoute } from '../types';

interface AccessMembershipProps {
  onNavigate: (route: NavigationRoute) => void;
}

export const AccessMembership: React.FC<AccessMembershipProps> = ({ onNavigate }) => {
  return (
    <section id="access" className="py-20 bg-[#101B20] text-[#E8F2EE] relative border-t border-[#152B30]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#152B30] to-[#101B20] border border-[#16A36A]/40 p-8 sm:p-12 overflow-hidden purple-glow-box">
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#16A36A]/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#9560E8]/10 blur-[90px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101B20] border border-[#16A36A]/40 text-xs font-mono text-[#16A36A]">
              <Lock className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>CONTROLLED ACCESS ONBOARDING</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#E8F2EE]">
              Ready to Upgrade Your <br className="hidden sm:inline" />
              <span className="purple-glow-text text-[#E8F2EE]">Market Execution?</span>
            </h2>

            <p className="text-base text-[#A9BEB5] leading-relaxed">
              PipPilotAi memberships are admitted in regulated cohorts to preserve computational latency and ensure individual execution guidance.
            </p>

            {/* Access Principles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 pb-4">
              <div className="p-3.5 rounded-xl bg-[#101B20]/80 border border-[#1A363E] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#E8F2EE]">Admin Approval</h4>
                  <p className="text-[11px] text-[#A9BEB5]">Every trader request is reviewed before activation.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#101B20]/80 border border-[#1A363E] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#168BFF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#E8F2EE]">Zero Hidden Fees</h4>
                  <p className="text-[11px] text-[#A9BEB5]">Transparent terms arranged externally with administration.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#101B20]/80 border border-[#1A363E] flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-[#9560E8] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#E8F2EE]">Personal Oversight</h4>
                  <p className="text-[11px] text-[#A9BEB5]">Direct communication during onboarding and setup.</p>
                </div>
              </div>
            </div>

            {/* Prominent Access Button */}
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/register')}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-base shadow-xl shadow-[#16A36A]/30 hover:shadow-2xl hover:shadow-[#16A36A]/40 transition-all duration-200 inline-flex items-center justify-center gap-2.5 group active:scale-[0.99]"
              >
                <span>Request Platform Access</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <p className="text-xs text-[#A9BEB5] font-mono">
              Next onboarding intake begins upon administrator verification.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
