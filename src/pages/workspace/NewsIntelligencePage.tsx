import React, { useState } from 'react';
import { AlertTriangle, Calendar, Globe } from 'lucide-react';
import { CORE_ECONOMIC_EVENTS } from '../../data/workspaceData';

export const NewsIntelligencePage: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<'CPI' | 'PPI' | 'NFP' | 'FOMC'>('CPI');
  const activeEvent =
    CORE_ECONOMIC_EVENTS.find((evt) => evt.tag === selectedTag) ?? CORE_ECONOMIC_EVENTS[0];

  return (
    <div className="space-y-6">
      <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#168BFF]">
              Macro Catalyst Tracking
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text">
              Economic News Intelligence (CPI, PPI, NFP, FOMC)
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#101B20] border border-[#1A363E] text-[#E69A36]">
            Sample Calendar · Not Live Feed
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['CPI', 'PPI', 'NFP', 'FOMC'] as const).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                selectedTag === tag
                  ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE] shadow-md shadow-[#168BFF]/30'
                  : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] hover:border-[#168BFF]/40'
              }`}
            >
              {tag} Event Insight
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Catalyst Detail */}
        <div className="lg:col-span-6 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <span className="text-sm font-bold font-mono text-[#E8F2EE] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#168BFF]" />
              {activeEvent.name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30 uppercase font-bold">
              {activeEvent.impact} Impact
            </span>
          </div>

          <p className="text-xs text-[#A9BEB5] leading-relaxed">{activeEvent.biasNote}</p>

          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Schedule</span>
              <span className="font-bold text-[#E8F2EE]">{activeEvent.date}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Previous</span>
              <span className="font-bold text-[#E8F2EE]">{activeEvent.previous}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
              <span className="text-[10px] text-[#A9BEB5] block">Consensus</span>
              <span className="font-bold text-[#168BFF]">{activeEvent.forecast}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#168BFF] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Monitored Assets:
            </span>
            <span className="text-[#E8F2EE] font-semibold">
              {activeEvent.affectedAssets.join(', ')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#E69A36]/10 border border-[#E69A36]/30 text-xs text-[#A9BEB5] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5" />
            <span>
              Pre-event protection rule: high-impact macro windows pause new trade proposals 30 minutes prior to release to avoid spread spikes.
            </span>
          </div>
        </div>

        {/* Core Macro Calendar List */}
        <div className="lg:col-span-6 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A9BEB5]">
              Core 4 Economic Calendar Radar
            </h3>
            <span className="text-xs font-mono text-[#16A36A]">Illustrative Schedule</span>
          </div>

          <div className="space-y-2.5">
            {CORE_ECONOMIC_EVENTS.map((evt) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedTag(evt.tag)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedTag === evt.tag
                    ? 'bg-[#101B20] border-[#168BFF] shadow-sm'
                    : 'bg-[#101B20]/60 border-[#1A363E] hover:border-[#1A363E]/80'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-bold text-[#E8F2EE]">{evt.tag}</span>
                  <span className="text-[11px] text-[#A9BEB5]">{evt.date}</span>
                </div>
                <p className="text-xs text-[#A9BEB5] mt-1 font-medium">{evt.name}</p>
                <div className="mt-2 pt-1.5 border-t border-[#1A363E]/50 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5]">
                  <span>
                    Prev: <strong className="text-[#E8F2EE]">{evt.previous}</strong>
                  </span>
                  <span>
                    Consensus: <strong className="text-[#168BFF]">{evt.forecast}</strong>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
