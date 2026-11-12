import React from 'react';
import { UserPlus, KeyRound, ShieldCheck, LogIn, Sliders, ArrowRight } from 'lucide-react';
import { NavigationRoute } from '../types';

interface HowItWorksProps {
  onNavigate: (route: NavigationRoute) => void;
}

const steps = [
  {
    step: '01',
    title: 'Create an Account',
    description: 'Set up your trader profile and register your contact details on the PipPilotAi portal.',
    icon: UserPlus,
    accent: '#16A36A',
  },
  {
    step: '02',
    title: 'Request Platform Access',
    description: 'Submit an access application specifying your experience level and preferred asset focus.',
    icon: KeyRound,
    accent: '#168BFF',
  },
  {
    step: '03',
    title: 'Administrator Verification',
    description: 'Platform administrators verify external subscription arrangements and manually approve access.',
    icon: ShieldCheck,
    accent: '#9560E8',
  },
  {
    step: '04',
    title: 'Sign In to Workspace',
    description: 'Gain authenticated access to member-tier signals, live confluence feeds, and macro updates.',
    icon: LogIn,
    accent: '#16A36A',
  },
  {
    step: '05',
    title: 'Configure & Analyse',
    description: 'Tailor asset alerts, adjust risk limits, and review semi-automated trade setups with full autonomy.',
    icon: Sliders,
    accent: '#168BFF',
  },
];

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  return (
    <section id="how-it-works" className="py-20 bg-[#101B20] text-[#E8F2EE] relative border-t border-[#152B30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#152B30] border border-[#9560E8]/40 text-xs font-mono text-[#9560E8]">
            <span>ONBOARDING ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#E8F2EE]">
            How Platform Access <span className="purple-glow-text text-[#E8F2EE]">Works</span>
          </h2>
          <p className="text-base sm:text-lg text-[#A9BEB5] leading-relaxed">
            PipPilotAi operates an exclusive, administrator-verified onboarding model to ensure platform stability and dedicated resource allocation.
          </p>
        </div>

        {/* 5-Step Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 relative flex flex-col justify-between hover:border-[#16A36A]/40 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-[#101B20] text-[#A9BEB5] border border-[#1A363E]">
                      Step {item.step}
                    </span>
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${item.accent}20`, color: item.accent }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#E8F2EE] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#A9BEB5] leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1A363E]/60 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5]">
                  <span>Phase {idx + 1} of 5</span>
                  <span className="text-[#16A36A]">Verified</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Callout */}
        <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 purple-glow-box">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-[#E8F2EE]">Curated Membership Model</h4>
            <p className="text-xs text-[#A9BEB5] max-w-2xl">
              Payment verification and access activation are conducted externally by platform administrators prior to granting full access. No automatic billing or hidden recurring charges.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/register')}
            className="px-6 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold shrink-0 flex items-center gap-2 shadow-md shadow-[#16A36A]/25 transition-all"
          >
            <span>Request Access</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
