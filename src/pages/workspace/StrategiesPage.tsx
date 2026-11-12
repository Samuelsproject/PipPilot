import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Layers, ShieldAlert, Sparkles } from 'lucide-react';
import { STRATEGY_MODULES } from '../../data/workspaceData';

export const StrategiesPage: React.FC = () => {
  const [styleFilter, setStyleFilter] = useState<'ALL' | 'INTRADAY' | 'SWING'>('ALL');
  const [noTradeThreshold, setNoTradeThreshold] = useState(60);

  return (
    <div className="space-y-6">
      {/* Header & Intraday/Swing Filter */}
      <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9560E8]">
            Institutional Methodology
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text">
            SMC, ICT, CRT & Confluence Filters
          </h2>
          <p className="text-xs text-[#A9BEB5] max-w-2xl">
            PipPilotAi unifies institutional price-action models with quantitative NO TRADE filters. Rule configurations below reflect the planned analytical engine architecture.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E] shrink-0 self-start sm:self-auto">
          {(['ALL', 'INTRADAY', 'SWING'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStyleFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                styleFilter === tab
                  ? 'bg-[#16A36A] text-[#E8F2EE]'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STRATEGY_MODULES.filter((mod) => {
          if (styleFilter === 'INTRADAY') return mod.cadence.includes('Intraday') || mod.code === 'IND';
          if (styleFilter === 'SWING') return mod.cadence.includes('Swing') || mod.code === 'IND';
          return true;
        }).map((mod) => (
          <div
            key={mod.id}
            className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                  style={{ backgroundColor: `${mod.accent}20`, color: mod.accent }}
                >
                  {mod.code}
                </span>
                <h3 className="text-base font-bold text-[#E8F2EE]">{mod.name}</h3>
              </div>
              <span className="text-[11px] font-mono text-[#168BFF]">{mod.cadence}</span>
            </div>

            <p className="text-xs text-[#A9BEB5] leading-relaxed">{mod.summary}</p>

            <ul className="space-y-2 pt-2 border-t border-[#1A363E]">
              {mod.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-xs text-[#A9BEB5]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Confluence & NO TRADE Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#168BFF]" />
              Intraday vs Swing Confluence Matrix
            </span>
            <span className="text-[11px] font-mono text-[#16A36A]">Minimum 1:2.0 R:R</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1.5">
              <span className="text-[#168BFF] font-bold block">Intraday Execution</span>
              <p className="text-[11px] font-sans text-[#A9BEB5]">
                H1 bias + M15/M5 FVG mitigation during London and New York Kill Zones.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1.5">
              <span className="text-[#9560E8] font-bold block">Swing Execution</span>
              <p className="text-[11px] font-sans text-[#A9BEB5]">
                D1/H4 CRT range sweeps and unmitigated weekly/daily Order Blocks.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#152B30] border border-[#E69A36]/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <span className="text-xs font-mono font-bold text-[#E69A36] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              NO TRADE Capital Filter
            </span>
            <span className="text-xs font-mono text-[#E8F2EE]">
              Max Choppiness: <strong className="text-[#168BFF]">{noTradeThreshold}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={45}
              max={75}
              step={1}
              value={noTradeThreshold}
              onChange={(e) => setNoTradeThreshold(Number(e.target.value))}
              className="w-full accent-[#E69A36]"
              aria-label="Choppiness NO TRADE threshold"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#A9BEB5]">
              <span>Strict (45)</span>
              <span>Balanced (60)</span>
              <span>Permissive (75)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-xs text-[#A9BEB5] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5" />
            <span>
              When market Choppiness exceeds <strong className="text-[#E8F2EE] font-mono">{noTradeThreshold}.0</strong> or conflicting H4/M15 bias is detected, proposals are automatically suppressed.
            </span>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-[#152B30]/60 border border-[#1A363E] text-xs text-[#A9BEB5] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#9560E8] shrink-0" />
        <span>
          Strategy configuration parameters are local workspace preferences until live signal orchestration is connected.
        </span>
      </div>
    </div>
  );
};
