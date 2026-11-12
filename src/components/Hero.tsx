import React, { useState } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Layers, 
  Cpu, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { NavigationRoute } from '../types';

interface HeroProps {
  onNavigate: (route: NavigationRoute, hash?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'notrade'>('setup');
  const [selectedAsset, setSelectedAsset] = useState<'XAU/USD' | 'EUR/USD' | 'US30'>('XAU/USD');

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-grid-pattern">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[450px] bg-[#9560E8]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-12 left-10 w-72 h-72 bg-[#16A36A]/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-[#168BFF]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Intelligence Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#152B30]/90 border border-[#9560E8]/30 shadow-sm purple-glow-box text-xs font-medium text-[#E8F2EE]">
            <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
            <span className="text-[#A9BEB5]">Institutional Precision:</span>
            <span className="text-[#168BFF] font-semibold">SMC</span>
            <span className="text-[#A9BEB5]">•</span>
            <span className="text-[#16A36A] font-semibold">ICT</span>
            <span className="text-[#A9BEB5]">•</span>
            <span className="text-[#9560E8] font-semibold">CRT</span>
          </div>
        </div>

        {/* Main Headline & Description */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#E8F2EE] leading-[1.15]">
            Trade Smarter.{' '}
            <span className="relative inline-block text-[#E8F2EE] purple-glow-text">
              Analyse Deeper.
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9560E8] to-transparent opacity-70" />
            </span>{' '}
            <span className="bg-gradient-to-r from-[#16A36A] to-[#168BFF] bg-clip-text text-transparent">
              Stay in Control.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#A9BEB5] max-w-2xl mx-auto font-normal leading-relaxed">
            PipPilotAi combines advanced market analysis, intelligent trading signals and disciplined risk management to help traders make more informed trading decisions.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={() => onNavigate('/register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-base shadow-lg shadow-[#16A36A]/25 hover:shadow-xl hover:shadow-[#16A36A]/35 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              <span>Get Access</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#152B30] hover:bg-[#1B363C] text-[#E8F2EE] font-semibold text-base border border-[#1A363E] hover:border-[#168BFF]/40 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#168BFF]" />
              <span>Explore Features</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#A9BEB5]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
              <span>Disciplined Risk Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#168BFF]" />
              <span>Semi-Automated Human Approval</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#E69A36]" />
              <span>Choppiness 'NO TRADE' Shield</span>
            </div>
          </div>
        </div>

        {/* Realistic Dashboard Preview Mockup (Mobile-first responsive) */}
        <div className="mt-12 sm:mt-16 relative">
          {/* Subtle Outer Purple Ambient Accent Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#16A36A]/20 via-[#9560E8]/20 to-[#168BFF]/20 rounded-2xl sm:rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden purple-glow-box">
            {/* Mockup Header Bar */}
            <div className="px-4 sm:px-6 py-3 bg-[#101B20]/90 border-b border-[#1A363E] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E05252]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#E69A36]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#16A36A]/80" />
                </div>
                <div className="hidden sm:block h-4 w-[1px] bg-[#1A363E]" />
                <span className="text-xs font-mono font-medium text-[#E8F2EE] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#16A36A]" />
                  PipPilot Engine v2.4 <span className="text-[#A9BEB5] font-normal">• Live Market Context</span>
                </span>
              </div>

              {/* Asset Selector */}
              <div className="flex items-center gap-1 bg-[#101B20] p-1 rounded-lg border border-[#1A363E]">
                {(['XAU/USD', 'EUR/USD', 'US30'] as const).map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
                      selectedAsset === asset
                        ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
                        : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>

              {/* Direct Link to full interactive /app */}
              <button
                onClick={() => onNavigate('/app')}
                className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[#168BFF] bg-[#168BFF]/10 hover:bg-[#168BFF]/20 px-3 py-1.5 rounded-lg border border-[#168BFF]/30 transition-colors"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Mockup Dashboard Content Grid */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left / Center: Interactive Simulated Chart Area (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Chart Header info */}
                <div className="flex items-center justify-between bg-[#101B20]/60 p-3 rounded-xl border border-[#1A363E]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono text-[#E8F2EE]">{selectedAsset}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#16A36A]/15 text-[#16A36A] font-semibold">
                        M15 / H1 Alignment
                      </span>
                    </div>
                    <p className="text-xs text-[#A9BEB5] font-mono mt-0.5">
                      {selectedAsset === 'XAU/USD' ? 'Gold Spot / US Dollar' : selectedAsset === 'EUR/USD' ? 'Euro / US Dollar' : 'Wall Street 30 Index'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-[#E8F2EE]">
                      {selectedAsset === 'XAU/USD' ? '2,648.40' : selectedAsset === 'EUR/USD' ? '1.0842' : '43,890.10'}
                    </span>
                    <p className="text-[11px] font-mono text-[#16A36A] flex items-center justify-end gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Bullish Structure (SMC)
                    </p>
                  </div>
                </div>

                {/* SVG Visual Candlestick & Concept Overlay Representation */}
                <div className="relative h-56 sm:h-64 w-full bg-[#101B20] rounded-xl border border-[#1A363E] p-3 flex flex-col justify-between overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 opacity-25">
                    <div className="border-b border-[#A9BEB5]/20 w-full" />
                    <div className="border-b border-[#A9BEB5]/20 w-full" />
                    <div className="border-b border-[#A9BEB5]/20 w-full" />
                    <div className="border-b border-[#A9BEB5]/20 w-full" />
                  </div>

                  {/* SMC / ICT Overlays annotations */}
                  <div className="absolute top-4 left-6 z-10 flex flex-wrap gap-2">
                    <span className="text-[10px] font-mono bg-[#9560E8]/20 border border-[#9560E8]/40 text-[#E8F2EE] px-2 py-0.5 rounded">
                      FVG: 2,642.10 — 2,645.80
                    </span>
                    <span className="text-[10px] font-mono bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] px-2 py-0.5 rounded">
                      Asian Range Liquidity Swept
                    </span>
                    <span className="text-[10px] font-mono bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] px-2 py-0.5 rounded">
                      Bullish OB Confirmed
                    </span>
                  </div>

                  {/* Stylized Candlestick Chart SVG */}
                  <svg className="w-full h-full relative z-0" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16A36A" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#16A36A" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="fvgGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#9560E8" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#9560E8" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* FVG Highlight Box */}
                    <rect x="220" y="60" width="160" height="40" fill="url(#fvgGrad)" stroke="#9560E8" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="225" y="55" fill="#A9BEB5" fontSize="9" fontFamily="monospace">ICT Fair Value Gap</text>

                    {/* Liquidity Sweep Dashed Level */}
                    <line x1="30" y1="140" x2="480" y2="140" stroke="#E69A36" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="35" y="135" fill="#E69A36" fontSize="9" fontFamily="monospace">Liquidity Low Swept (Sell-side)</text>

                    {/* Stylized candlesticks */}
                    {/* Candle 1: Bear */}
                    <line x1="50" y1="60" x2="50" y2="120" stroke="#E05252" strokeWidth="1.5" />
                    <rect x="44" y="70" width="12" height="40" fill="#E05252" rx="1" />

                    {/* Candle 2: Bear sweep */}
                    <line x1="90" y1="90" x2="90" y2="155" stroke="#E05252" strokeWidth="1.5" />
                    <rect x="84" y="100" width="12" height="42" fill="#E05252" rx="1" />

                    {/* Candle 3: Hammer Rejection */}
                    <line x1="130" y1="85" x2="130" y2="160" stroke="#16A36A" strokeWidth="1.5" />
                    <rect x="124" y="88" width="12" height="30" fill="#16A36A" rx="1" />

                    {/* Candle 4: Bullish Displacement */}
                    <line x1="170" y1="65" x2="170" y2="125" stroke="#16A36A" strokeWidth="1.5" />
                    <rect x="164" y="70" width="12" height="48" fill="#16A36A" rx="1" />

                    {/* Candle 5: Pullback into FVG */}
                    <line x1="210" y1="75" x2="210" y2="110" stroke="#E05252" strokeWidth="1.5" />
                    <rect x="204" y="80" width="12" height="22" fill="#E05252" rx="1" />

                    {/* Candle 6: FVG mitigation bull */}
                    <line x1="250" y1="60" x2="250" y2="98" stroke="#16A36A" strokeWidth="1.5" />
                    <rect x="244" y="65" width="12" height="30" fill="#16A36A" rx="1" />

                    {/* Candle 7: Expansion Bull */}
                    <line x1="290" y1="35" x2="290" y2="80" stroke="#16A36A" strokeWidth="1.5" />
                    <rect x="284" y="40" width="12" height="35" fill="#16A36A" rx="1" />

                    {/* Candle 8: Retest High */}
                    <line x1="330" y1="30" x2="330" y2="70" stroke="#16A36A" strokeWidth="1.5" />
                    <rect x="324" y="32" width="12" height="28" fill="#16A36A" rx="1" />

                    {/* Candle 9: Consolidation */}
                    <line x1="370" y1="25" x2="370" y2="55" stroke="#E69A36" strokeWidth="1.5" />
                    <rect x="364" y="30" width="12" height="18" fill="#E69A36" rx="1" />

                    {/* Candle 10: Current */}
                    <line x1="410" y1="18" x2="410" y2="50" stroke="#16A36A" strokeWidth="1.5" />
                    <rect x="404" y="20" width="12" height="25" fill="#16A36A" rx="1" />

                    {/* Dynamic projection line */}
                    <path d="M 416 28 Q 450 15 480 10" fill="none" stroke="#168BFF" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>

                  {/* Indicator Ticker Footer */}
                  <div className="z-10 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5] pt-1 border-t border-[#1A363E]">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                      CRT Range: High 2,654.00 | Low 2,638.50
                    </span>
                    <span className="text-[#168BFF]">RSI: 58.4 (Neutral-Bull)</span>
                  </div>
                </div>
              </div>

              {/* Right: AI Intelligence Setup & Evaluation Mode (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                {/* Toggle: Setup vs Choppiness NO TRADE Protection */}
                <div className="flex bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
                  <button
                    onClick={() => setActiveTab('setup')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'setup'
                        ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
                        : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid Opportunity</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notrade')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'notrade'
                        ? 'bg-[#E69A36] text-[#101B20] shadow-sm'
                        : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>'NO TRADE' Filter</span>
                  </button>
                </div>

                {/* Tab 1: Valid Setup Card */}
                {activeTab === 'setup' ? (
                  <div className="bg-[#101B20]/80 rounded-xl p-4 border border-[#16A36A]/30 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/40 uppercase tracking-wide">
                        AI Signal Generated
                      </span>
                      <span className="text-xs font-mono text-[#A9BEB5]">Score: 89/100</span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-sm font-bold text-[#E8F2EE]">XAU/USD Long Setup</h4>
                        <span className="text-xs font-mono text-[#168BFF] font-semibold">R:R 1 : 2.8</span>
                      </div>
                      <p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
                        Confluence detected: H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.
                      </p>
                    </div>

                    {/* Execution Parameters */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-[#152B30] p-2 rounded-lg border border-[#1A363E]">
                        <span className="text-[10px] text-[#A9BEB5] block">Entry Level</span>
                        <span className="text-xs font-bold text-[#E8F2EE]">2,644.20</span>
                      </div>
                      <div className="bg-[#152B30] p-2 rounded-lg border border-[#1A363E]">
                        <span className="text-[10px] text-[#E05252] block">Stop Loss</span>
                        <span className="text-xs font-bold text-[#E8F2EE]">2,639.80</span>
                      </div>
                      <div className="bg-[#152B30] p-2 rounded-lg border border-[#1A363E]">
                        <span className="text-[10px] text-[#16A36A] block">Take Profit</span>
                        <span className="text-xs font-bold text-[#E8F2EE]">2,656.50</span>
                      </div>
                    </div>

                    {/* Trader approval step reminder */}
                    <div className="p-2.5 rounded-lg bg-[#152B30] border border-[#168BFF]/25 flex items-start gap-2 text-xs text-[#E8F2EE]">
                      <Cpu className="w-4 h-4 text-[#168BFF] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#A9BEB5]">
                        <strong className="text-[#E8F2EE]">Human-in-the-Loop:</strong> Trader retains full control to inspect, modify, approve or decline before any MT5 validation.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Choppiness / Low-Quality Rejection */
                  <div className="bg-[#101B20]/80 rounded-xl p-4 border border-[#E69A36]/30 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/40 uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> NO TRADE SIGNAL
                      </span>
                      <span className="text-xs font-mono text-[#E69A36]">Capital Preservation</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#E8F2EE]">EUR/USD Pre-FOMC Filter</h4>
                      <p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
                        Setup rejected by engine. Unfavourable conditions detected: High-impact FOMC event in &lt;90 minutes, contradictory orderflow between M15 and H4, and spread widening.
                      </p>
                    </div>

                    <div className="bg-[#152B30] p-3 rounded-lg border border-[#E69A36]/25 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#A9BEB5]">Choppiness Index</span>
                        <span className="font-mono text-[#E69A36] font-semibold">61.4 (Unstable)</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#A9BEB5]">Event Proximity</span>
                        <span className="font-mono text-[#E8F2EE]">FOMC Rate Decision</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#A9BEB5]">Engine Decision</span>
                        <span className="font-mono text-[#E69A36] font-bold">STAND ASIDE</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#A9BEB5] italic">
                      "Disciplined traders protect capital when edge is absent. PipPilotAi prioritises quality over frequency."
                    </p>
                  </div>
                )}

                {/* Bottom link to view full preview */}
                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('/app')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#168BFF]/15 hover:bg-[#168BFF]/25 border border-[#168BFF]/40 text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-[#168BFF]" />
                    <span>Open Interactive Dashboard Preview (/app)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
