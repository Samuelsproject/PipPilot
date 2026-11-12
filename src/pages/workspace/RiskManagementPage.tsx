import React, { useState } from 'react';
import { Calculator, CheckCircle2, ShieldAlert, Sliders } from 'lucide-react';
import { AssetSymbol } from '../../data/workspaceData';

export const RiskManagementPage: React.FC = () => {
  const [asset, setAsset] = useState<AssetSymbol>('XAU/USD');
  const [accountBalance, setAccountBalance] = useState(25000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [stopLossPips, setStopLossPips] = useState(30);
  const [dailyLossCap, setDailyLossCap] = useState(3.0);
  const [maxCorrelatedPairs, setMaxCorrelatedPairs] = useState(2);

  const riskAmount = (accountBalance * riskPercent) / 100;
  const calculatedLotSize = Math.max(0.01, +(riskAmount / (stopLossPips * 10)).toFixed(2));
  const dailyLossDollars = (accountBalance * dailyLossCap) / 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Position Sizing & Risk-Per-Trade Calculator */}
        <div className="lg:col-span-7 bg-[#152B30] border border-[#16A36A]/35 rounded-2xl p-5 sm:p-6 purple-glow-box space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3">
            <span className="text-xs font-mono font-bold text-[#16A36A] flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              POSITION SIZING & RISK CALCULATOR
            </span>
            <span className="text-xs font-mono font-bold text-[#168BFF]">
              {calculatedLotSize} Lots
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Instrument Selector */}
            <div>
              <span className="text-[#A9BEB5] block mb-1.5">Instrument Focus</span>
              <div className="grid grid-cols-4 gap-2">
                {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setAsset(sym)}
                    className={`py-2 rounded-xl border font-bold transition-all ${
                      asset === sym
                        ? 'bg-[#16A36A] border-[#16A36A] text-[#E8F2EE]'
                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE]'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Balance */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#A9BEB5]">Account Balance</span>
                <span className="text-[#E8F2EE] font-bold">
                  ${accountBalance.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={100000}
                step={1000}
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                className="w-full accent-[#16A36A] cursor-pointer"
                aria-label="Account balance"
              />
            </div>

            {/* Risk Percent */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#A9BEB5]">Risk Per Trade (%)</span>
                <span className="text-[#168BFF] font-bold">{riskPercent.toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRiskPercent(pct)}
                    className={`py-2 rounded-xl border font-bold transition-all ${
                      riskPercent === pct
                        ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE]'
                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Stop-Loss Distance */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#A9BEB5]">Stop-Loss Distance</span>
                <span className="text-[#E8F2EE] font-bold">{stopLossPips} Pips</span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={stopLossPips}
                onChange={(e) => setStopLossPips(Number(e.target.value))}
                className="w-full accent-[#168BFF] cursor-pointer"
                aria-label="Stop-loss pips"
              />
            </div>

            {/* Calculated Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] uppercase block">Risk Amount</span>
                <span className="text-base font-bold text-[#E05252]">
                  ${riskAmount.toFixed(2)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#16A36A]/40">
                <span className="text-[10px] text-[#A9BEB5] uppercase block">Position Size</span>
                <span className="text-base font-bold text-[#16A36A]">
                  {calculatedLotSize} Lots
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E]">
                <span className="text-[10px] text-[#A9BEB5] uppercase block">Selected Pair</span>
                <span className="text-base font-bold text-[#168BFF]">{asset}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stop-Loss Validation, Daily Loss Limits & Exposure Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Daily Loss Limits & Exposure Controls */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#168BFF]" />
                Daily Loss & Exposure Limits
              </span>
              <span className="text-xs font-mono text-[#E05252] font-bold">
                -${dailyLossDollars.toFixed(0)} Max/Day
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#A9BEB5]">Daily Loss Cap (%)</span>
                  <span className="text-[#168BFF] font-bold">{dailyLossCap.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={0.5}
                  value={dailyLossCap}
                  onChange={(e) => setDailyLossCap(Number(e.target.value))}
                  className="w-full accent-[#E05252] cursor-pointer"
                  aria-label="Daily loss limit"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#A9BEB5]">Max Correlated Exposure</span>
                  <span className="text-[#16A36A] font-bold">{maxCorrelatedPairs} Positions</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setMaxCorrelatedPairs(count)}
                      className={`py-2 rounded-xl border font-bold transition-colors ${
                        maxCorrelatedPairs === count
                          ? 'bg-[#16A36A] border-[#16A36A] text-[#E8F2EE]'
                          : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5]'
                      }`}
                    >
                      {count} Max
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stop-Loss Validation Guardrails */}
          <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#16A36A]" />
              Mandatory Stop-Loss Validation
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A9BEB5]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span>Every trade proposal requires an explicit structural Stop-Loss level.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span>Minimum 1:2.0 Risk-to-Reward ratio enforced before trader approval.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span>Correlated USD block exposure cap prevents stacked drawdown.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
