import React from 'react';
import { Compass, Target, ShieldCheck, Cpu } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#101B20] text-[#E8F2EE] relative border-t border-[#152B30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#152B30] border border-[#168BFF]/40 text-xs font-mono text-[#168BFF]">
            <span>FOUNDING PHILOSOPHY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#E8F2EE]">
            About <span className="purple-glow-text text-[#E8F2EE]">PipPilotAi</span>
          </h2>
          <p className="text-base sm:text-lg text-[#A9BEB5] leading-relaxed">
            Born from the realization that 90% of retail traders fail not from lack of information, but from lack of discipline, emotional bias, and chasing low-probability market noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#16A36A]/20 text-[#16A36A] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#E8F2EE]">Structured Confluence</h3>
            <p className="text-xs text-[#A9BEB5] leading-relaxed">
              We replace guesswork with rigorous market structure rules: Smart Money Concepts, Fair Value Gaps, and Candle Range Theory. If conditions fail the filter, no signal is issued.
            </p>
          </div>

          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#168BFF]/20 text-[#168BFF] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#E8F2EE]">Human-Centric Control</h3>
            <p className="text-xs text-[#A9BEB5] leading-relaxed">
              We do not believe in unchecked black-box bots. The algorithmic engine identifies high-confluence setups and formulates execution plans, but the trader retains final authorization.
            </p>
          </div>

          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#9560E8]/20 text-[#9560E8] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#E8F2EE]">Capital First</h3>
            <p className="text-xs text-[#A9BEB5] leading-relaxed">
              Every feature, from lot size calculation to choppiness protection and pre-news timeouts, is designed to ensure capital survival above all else.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
