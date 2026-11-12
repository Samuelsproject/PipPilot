import React, { useState } from 'react';
import { AlertCircle, FlaskConical, Play, ShieldAlert } from 'lucide-react';
import { AssetSymbol, TimeframeOption } from '../../data/workspaceData';

export const BacktestingPage: React.FC = () => {
  const [strategy, setStrategy] = useState<'SMC' | 'ICT' | 'CRT'>('SMC');
  const [asset, setAsset] = useState<AssetSymbol>('XAU/USD');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('M15');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(1.0);
  const [dateWindow, setDateWindow] = useState<'30D' | '90D' | '180D'>('90D');
  const [runAttempted, setRunAttempted] = useState(false);

  const handleRunAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setRunAttempted(true);
  };

  return (
    <div className="space-y-6">
      {/* Honesty / Separation Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#152B30] border border-[#9560E8]/40 purple-glow-box flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#9560E8] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h2 className="text-sm font-bold text-[#E8F2EE]">
            Historical Backtesting Engine — Actual vs Demonstration Separation
          </h2>
          <p className="text-[#A9BEB5] leading-relaxed">
            No historical market-tick database or backtest execution engine is connected yet. Actual backtest runs return an unexecuted state until verified historical data feeds are integrated. No performance statistics, win rates, or equity curves are fabricated here.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Strategy Test Parameters */}
        <form
          onSubmit={handleRunAttempt}
          className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
            <span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-[#16A36A]" />
              Backtest Configuration
            </span>
            <span className="text-[10px] font-mono text-[#E69A36]">Offline Engine</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-[#A9BEB5] mb-1.5">Strategy Framework</label>
              <div className="grid grid-cols-3 gap-2">
                {(['SMC', 'ICT', 'CRT'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStrategy(s)}
                    className={`py-2 rounded-xl border font-bold transition-colors ${
                      strategy === s
                        ? 'bg-[#16A36A] border-[#16A36A] text-[#E8F2EE]'
                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#A9BEB5] mb-1.5">Instrument</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((pair) => (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => setAsset(pair)}
                    className={`py-2 rounded-xl border font-bold transition-colors ${
                      asset === pair
                        ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE]'
                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5]'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A9BEB5] mb-1.5">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#168BFF]"
                >
                  {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A9BEB5] mb-1.5">Lookback Window</label>
                <select
                  value={dateWindow}
                  onChange={(e) => setDateWindow(e.target.value as '30D' | '90D' | '180D')}
                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#168BFF]"
                >
                  <option value="30D">Last 30 Days</option>
                  <option value="90D">Last 90 Days</option>
                  <option value="180D">Last 180 Days</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A9BEB5] mb-1.5">Initial Capital ($)</label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value) || 1000)}
                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
                />
              </div>
              <div>
                <label className="block text-[#A9BEB5] mb-1.5">Risk / Trade (%)</label>
                <input
                  type="number"
                  min={0.25}
                  max={3}
                  step={0.25}
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Check Backtest Engine Status</span>
          </button>
        </form>

        {/* Right: Actual Results Area (Zero Fabricated Metrics) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3">
              <h3 className="text-sm font-bold text-[#E8F2EE]">
                Actual Backtest Results
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#101B20] border border-[#1A363E] text-[#E69A36]">
                NOT EXECUTED · NO HISTORICAL FEED
              </span>
            </div>

            {runAttempted && (
              <div className="p-3.5 rounded-xl bg-[#E69A36]/10 border border-[#E69A36]/40 text-xs text-[#E8F2EE] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5" />
                <span>
                  Backtest requested for <strong className="font-mono">{strategy} · {asset} ({timeframe}, {dateWindow})</strong>. Historical candle storage and backtest worker are not yet connected, so no result metrics were generated.
                </span>
              </div>
            )}

            {/* Empty unfabricated metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">Total Trades</span>
                <span className="text-base font-bold text-[#A9BEB5]">—</span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">Win Rate</span>
                <span className="text-base font-bold text-[#168BFF]">—</span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">Net Return</span>
                <span className="text-base font-bold text-[#168BFF]">—</span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">Max Drawdown</span>
                <span className="text-base font-bold text-[#A9BEB5]">—</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#101B20] border border-dashed border-[#1A363E] text-center space-y-1.5">
              <p className="text-xs font-semibold text-[#E8F2EE]">
                No Actual Backtest Data Available
              </p>
              <p className="text-[11px] text-[#A9BEB5] max-w-md mx-auto">
                Real backtest output will appear here once historical OHLCV data ingestion and strategy replay are implemented and verified.
              </p>
            </div>
          </div>

          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 text-xs text-[#A9BEB5]">
            <strong className="text-[#E8F2EE]">Demonstration vs Verified Data Policy:</strong>{' '}
            Sample scenarios shown elsewhere in the workspace are strictly labeled as illustrative previews and are never presented as historical backtest performance.
          </div>
        </div>
      </div>
    </div>
  );
};
