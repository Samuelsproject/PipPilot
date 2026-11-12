import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Cpu,
  Workflow,
  XCircle,
} from 'lucide-react';
import {
  AssetSymbol,
  SAMPLE_WATCHLIST,
  TimeframeOption,
} from '../../data/workspaceData';

export const TradingPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('XAU/USD');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('M15');
  const [approvalStatus, setApprovalStatus] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | 'MT5_VALIDATED'
  >('PENDING');
  const [showNoTradeDemo, setShowNoTradeDemo] = useState(false);

  const assetDetails =
    SAMPLE_WATCHLIST.find((a) => a.symbol === selectedAsset) ?? SAMPLE_WATCHLIST[0];

  return (
    <div className="space-y-5">
      {/* Instrument & Multi-Timeframe Controls */}
      <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
          {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((asset) => (
            <button
              key={asset}
              type="button"
              onClick={() => {
                setSelectedAsset(asset);
                setApprovalStatus('PENDING');
              }}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all ${
                selectedAsset === asset
                  ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              {asset}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
          {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md transition-all ${
                timeframe === tf
                  ? 'bg-[#168BFF] text-[#E8F2EE]'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Market Analysis & Multi-Timeframe Confluence Chart */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Asset Info Strip */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-[#E8F2EE]">
                  {selectedAsset}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#16A36A]/15 text-[#16A36A] border border-[#16A36A]/30 font-semibold">
                  {assetDetails.bias}
                </span>
                <span className="text-xs font-mono text-[#168BFF] font-semibold">
                  {timeframe}
                </span>
              </div>
              <p className="text-xs text-[#A9BEB5] font-mono mt-0.5">{assetDetails.name}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-[#168BFF]">
                {assetDetails.price}
              </span>
              <p
                className={`text-xs font-mono ${
                  assetDetails.positive ? 'text-[#16A36A]' : 'text-[#E05252]'
                }`}
              >
                {assetDetails.change} Session (Simulated)
              </p>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 purple-glow-box space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#A9BEB5]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#168BFF]" />
                Structural Confluence View ({timeframe})
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E69A36]" />
                <span>Simulated Market Preview</span>
              </div>
            </div>

            <div className="relative h-64 sm:h-72 w-full bg-[#101B20] rounded-xl border border-[#1A363E] p-3 flex flex-col justify-between overflow-hidden">
              <div className="z-10 flex flex-wrap gap-2 text-[10px] font-mono">
                <span className="bg-[#9560E8]/20 border border-[#9560E8]/40 text-[#E8F2EE] px-2 py-0.5 rounded">
                  Fair Value Gap (H1)
                </span>
                <span className="bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] px-2 py-0.5 rounded">
                  Liquidity Sweep Range
                </span>
                <span className="bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] px-2 py-0.5 rounded">
                  Bullish Order Block
                </span>
              </div>

              <svg
                className="w-full h-full relative z-0"
                viewBox="0 0 600 220"
                preserveAspectRatio="none"
                aria-label="Illustrative structural confluence chart"
              >
                <defs>
                  <linearGradient id="tradingChartFvg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9560E8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#9560E8" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="600" y2="50" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="170" x2="600" y2="170" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" />
                <rect x="250" y="70" width="180" height="50" fill="url(#tradingChartFvg)" stroke="#9560E8" strokeWidth="1" strokeDasharray="2 2" />
                <text x="255" y="65" fill="#9560E8" fontSize="10" fontFamily="monospace">ICT Fair Value Gap</text>
                <line x1="20" y1="160" x2="580" y2="160" stroke="#E69A36" strokeWidth="1" strokeDasharray="3 3" />
                <text x="30" y="155" fill="#E69A36" fontSize="9" fontFamily="monospace">Asian Session Low Swept</text>

                <line x1="50" y1="80" x2="50" y2="140" stroke="#E05252" strokeWidth="1.5" />
                <rect x="44" y="90" width="12" height="35" fill="#E05252" rx="1" />
                <line x1="90" y1="110" x2="90" y2="175" stroke="#E05252" strokeWidth="1.5" />
                <rect x="84" y="120" width="12" height="42" fill="#E05252" rx="1" />
                <line x1="130" y1="105" x2="130" y2="185" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="124" y="110" width="12" height="30" fill="#16A36A" rx="1" />
                <line x1="180" y1="75" x2="180" y2="145" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="174" y="80" width="12" height="50" fill="#16A36A" rx="1" />
                <line x1="230" y1="65" x2="230" y2="115" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="224" y="70" width="12" height="30" fill="#16A36A" rx="1" />
                <line x1="280" y1="85" x2="280" y2="125" stroke="#E05252" strokeWidth="1.5" />
                <rect x="274" y="90" width="12" height="25" fill="#E05252" rx="1" />
                <line x1="330" y1="60" x2="330" y2="110" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="324" y="65" width="12" height="35" fill="#16A36A" rx="1" />
                <line x1="380" y1="40" x2="380" y2="90" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="374" y="45" width="12" height="35" fill="#16A36A" rx="1" />
                <line x1="430" y1="35" x2="430" y2="75" stroke="#E69A36" strokeWidth="1.5" />
                <rect x="424" y="40" width="12" height="20" fill="#E69A36" rx="1" />
                <line x1="480" y1="20" x2="480" y2="65" stroke="#16A36A" strokeWidth="1.5" />
                <rect x="474" y="25" width="12" height="30" fill="#16A36A" rx="1" />
                <line x1="486" y1="30" x2="570" y2="15" stroke="#168BFF" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="570" cy="15" r="3" fill="#168BFF" />
              </svg>

              <div className="z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#A9BEB5] pt-1 border-t border-[#1A363E]">
                <span>
                  CRT High: {assetDetails.crtHigh} | Low: {assetDetails.crtLow}
                </span>
                <span className="text-[#16A36A]">Regime: {assetDetails.regime}</span>
              </div>
            </div>
          </div>

          {/* Multi-Timeframe Sync Breakdown */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#E8F2EE]">Multi-Timeframe Alignment</span>
              <span className="text-[#16A36A]">D1 / H4 / H1 / M15</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">Daily / H4 Bias</span>
                <span className="text-[#16A36A] font-bold">Bullish Structure</span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">H1 Liquidity</span>
                <span className="text-[#168BFF] font-bold">Sweep Confirmed</span>
              </div>
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] block">M15 Trigger</span>
                <span className="text-[#9560E8] font-bold">FVG Mitigated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Entry, Stop-Loss, Take-Profit & Trader Approval */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowNoTradeDemo(false);
                setApprovalStatus('PENDING');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                !showNoTradeDemo
                  ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Valid Setup</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNoTradeDemo(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                showNoTradeDemo
                  ? 'bg-[#E69A36] text-[#101B20] shadow-sm'
                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>'NO TRADE' Filter</span>
            </button>
          </div>

          {!showNoTradeDemo ? (
            <div className="bg-[#152B30] border border-[#16A36A]/40 rounded-2xl p-5 purple-glow-box space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/40 uppercase">
                  Pending Trader Review
                </span>
                <span className="text-xs font-mono text-[#A9BEB5]">Sample #842</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#E8F2EE]">
                    {selectedAsset} Trade Proposal
                  </h3>
                  <span className="text-xs font-mono text-[#168BFF] font-bold">
                    R:R {assetDetails.riskReward}
                  </span>
                </div>
                <p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
                  {assetDetails.confluenceNote}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                  <span className="text-[10px] text-[#A9BEB5] block">Entry Level</span>
                  <span className="text-xs font-bold text-[#E8F2EE]">{assetDetails.entry}</span>
                </div>
                <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                  <span className="text-[10px] text-[#E05252] block">Stop Loss</span>
                  <span className="text-xs font-bold text-[#E8F2EE]">{assetDetails.stopLoss}</span>
                </div>
                <div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
                  <span className="text-[10px] text-[#16A36A] block">Take Profit</span>
                  <span className="text-xs font-bold text-[#E8F2EE]">{assetDetails.takeProfit}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono text-[#A9BEB5] flex items-center justify-between">
                  <span>Semi-Automated Workflow:</span>
                  <span className="font-bold text-[#E8F2EE]">Step 3: Trader Review</span>
                </div>

                {approvalStatus === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('APPROVED')}
                      className="flex-1 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#16A36A]/20 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Setup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('REJECTED')}
                      className="flex-1 py-2.5 rounded-xl bg-[#101B20] hover:bg-[#1A363E] text-[#E05252] border border-[#E05252]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Setup</span>
                    </button>
                  </div>
                )}

                {approvalStatus === 'APPROVED' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#16A36A]/15 border border-[#16A36A]/40 text-xs text-[#E8F2EE] space-y-1">
                      <p className="font-bold text-[#16A36A] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Trader Approval Granted (Simulation)
                      </p>
                      <p className="text-[11px] text-[#A9BEB5]">
                        Setup is queued for planned MT5 execution validation. Live MT5 bridge is not connected.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('MT5_VALIDATED')}
                      className="w-full py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#168BFF]/25 transition-all"
                    >
                      <Workflow className="w-4 h-4" />
                      <span>Simulate MT5 Independent Validation</span>
                    </button>
                  </div>
                )}

                {approvalStatus === 'MT5_VALIDATED' && (
                  <div className="p-3.5 rounded-xl bg-[#168BFF]/15 border border-[#168BFF]/40 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#168BFF] font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        MT5 Client Validated (Simulation)
                      </span>
                      <span className="text-[10px] font-mono">Spread: 1.2 pips OK</span>
                    </div>
                    <p className="text-[11px] text-[#A9BEB5]">
                      Simulated check passed. Actual MT5 order transmission is under development and not active.
                    </p>
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('PENDING')}
                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
                    >
                      Reset Simulation
                    </button>
                  </div>
                )}

                {approvalStatus === 'REJECTED' && (
                  <div className="p-3 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] space-y-2">
                    <p className="font-bold text-[#E05252] flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Setup Declined by Trader
                    </p>
                    <p className="text-[11px] text-[#A9BEB5]">
                      Execution canceled. No instruction transmitted.
                    </p>
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('PENDING')}
                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
                    >
                      Reset Simulation
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#152B30] border border-[#E69A36]/40 rounded-2xl p-5 purple-glow-box space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/40 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> NO TRADE SIGNAL
                </span>
                <span className="text-xs font-mono text-[#E69A36]">Protection Active</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#E8F2EE]">Capital Preservation Filter</h3>
                <p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
                  Market conditions fail confluence requirements. The engine blocks trade proposals when noise is elevated.
                </p>
              </div>

              <div className="bg-[#101B20] p-3 rounded-xl border border-[#1A363E] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#A9BEB5]">Choppiness Index</span>
                  <span className="text-[#E69A36] font-bold">64.2 / 100 (High Noise)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9BEB5]">Orderflow Alignment</span>
                  <span className="text-[#E05252] font-bold">Conflicted (M15 vs H4)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9BEB5]">Economic Proximity</span>
                  <span className="text-[#E8F2EE]">FOMC within 2 hours</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
