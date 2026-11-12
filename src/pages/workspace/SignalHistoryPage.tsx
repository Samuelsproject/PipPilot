import React, { useState } from 'react';
import { Clock3, History } from 'lucide-react';
import {
  MAX_SHARED_SIGNALS,
  SHARED_PLATFORM_SIGNALS,
} from '../../data/workspaceData';

export const SignalHistoryPage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'NO_TRADE'>('ALL');

  const signals = SHARED_PLATFORM_SIGNALS.slice(0, MAX_SHARED_SIGNALS).filter(
    (sig) => filter === 'ALL' || sig.direction === filter
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#168BFF] flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              Rolling Shared Platform Feed
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101B20] border border-[#1A363E] text-[#16A36A]">
              Max {MAX_SHARED_SIGNALS} Signals Preserved
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text">
            Signal History & Outcome Log
          </h2>
          <p className="text-xs text-[#A9BEB5]">
            Showing {signals.length} of {SHARED_PLATFORM_SIGNALS.length} sample platform signals (capped at {MAX_SHARED_SIGNALS} shared records).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E] self-start sm:self-auto">
          {(['ALL', 'BUY', 'SELL', 'NO_TRADE'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                filter === tab
                  ? 'bg-[#16A36A] text-[#E8F2EE]'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              {tab === 'NO_TRADE' ? 'NO TRADE' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Signal Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3.5 hover:border-[#168BFF]/40 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs text-[#A9BEB5]">{sig.id}</span>
                <span className="font-bold text-sm text-[#E8F2EE]">{sig.pair}</span>
                <span className="text-[11px] text-[#168BFF]">{sig.timeframe}</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    sig.direction === 'BUY'
                      ? 'bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/30'
                      : sig.direction === 'SELL'
                      ? 'bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30'
                      : 'bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/30'
                  }`}
                >
                  {sig.direction === 'NO_TRADE' ? 'NO TRADE' : sig.direction}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#101B20] border border-[#1A363E] text-[#A9BEB5]">
                  {sig.status}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[#9560E8] font-semibold">
                {sig.strategy} · Confidence {sig.confidence}%
              </span>
              <p className="text-xs text-[#A9BEB5] leading-relaxed">{sig.analysisReasoning}</p>
            </div>

            {sig.entryPrice !== undefined && (
              <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                <div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
                  <span className="text-[10px] text-[#A9BEB5] block">Entry</span>
                  <span className="font-bold text-[#E8F2EE]">{sig.entryPrice}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
                  <span className="text-[10px] text-[#E05252] block">SL</span>
                  <span className="font-bold text-[#E8F2EE]">{sig.stopLoss}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
                  <span className="text-[10px] text-[#16A36A] block">TP</span>
                  <span className="font-bold text-[#E8F2EE]">{sig.takeProfit}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-[#A9BEB5] flex items-center gap-1">
                <Clock3 className="w-3.5 h-3.5" />
                {sig.timestamp}
              </span>
              <div className="flex items-center gap-3">
                {sig.riskReward && (
                  <span className="text-[#168BFF] font-bold">R:R {sig.riskReward}</span>
                )}
                <span
                  className={`font-bold ${
                    sig.outcome === 'TP_HIT'
                      ? 'text-[#16A36A]'
                      : sig.outcome === 'SL_HIT'
                      ? 'text-[#E05252]'
                      : sig.outcome === 'PROTECTED'
                      ? 'text-[#E69A36]'
                      : 'text-[#A9BEB5]'
                  }`}
                >
                  Outcome: {sig.outcome ?? 'SAMPLE'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
