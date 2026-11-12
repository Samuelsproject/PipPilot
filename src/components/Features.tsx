import React, { useState } from 'react';
import { 
  BarChart2, 
  Cpu, 
  Workflow, 
  Calendar, 
  ShieldAlert, 
  History, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calculator, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  FileCheck, 
  Zap, 
  ChevronRight 
} from 'lucide-react';
import { EconomicEvent, TradingSignal } from '../types';

const sampleEconomicEvents: EconomicEvent[] = [
  {
    id: 'eco-1',
    name: 'Consumer Price Index (CPI YoY)',
    tag: 'CPI',
    impact: 'Critical',
    date: 'Wednesday 12:30 GMT',
    previous: '3.1%',
    forecast: '2.9%',
    affectedAssets: ['XAU/USD', 'EUR/USD', 'US30'],
    biasNote: 'Higher than expected typically strengthens USD; gold may test discount liquidity levels.'
  },
  {
    id: 'eco-2',
    name: 'Non-Farm Payrolls (NFP) & Unemployment',
    tag: 'NFP',
    impact: 'Critical',
    date: 'First Friday 12:30 GMT',
    previous: '185K',
    forecast: '170K',
    affectedAssets: ['DXY', 'GBP/USD', 'NAS100'],
    biasNote: 'Extreme volatility window. Platform triggers pre-event protection 30m prior.'
  },
  {
    id: 'eco-3',
    name: 'FOMC Rate Decision & Press Conference',
    tag: 'FOMC',
    impact: 'Critical',
    date: 'Federal Reserve Cycle',
    previous: '5.25%',
    forecast: '5.00%',
    affectedAssets: ['All Major FX', 'Indices', 'Gold'],
    biasNote: 'Macro policy guidance shifts institutional liquidity parameters across all timeframes.'
  },
  {
    id: 'eco-4',
    name: 'Producer Price Index (PPI MoM)',
    tag: 'PPI',
    impact: 'High',
    date: 'Monthly Release',
    previous: '0.2%',
    forecast: '0.1%',
    affectedAssets: ['USD Pairs', 'Treasuries'],
    biasNote: 'Leading indicator for inflation trajectory; monitors wholesale cost pressures.'
  }
];

const samplePastSignals: TradingSignal[] = [
  {
    id: 'sig-101',
    pair: 'XAU/USD',
    direction: 'BUY',
    timeframe: 'H1 / M15',
    strategy: 'SMC Order Block',
    entryPrice: 2638.5,
    stopLoss: 2632.0,
    takeProfit: 2654.5,
    riskReward: '1 : 2.46',
    confidence: 88,
    status: 'EXECUTED',
    timestamp: 'Yesterday 09:15 GMT',
    analysisReasoning: 'London session liquidity sweep below 2635, retested H1 bullish order block with clean displacement.'
  },
  {
    id: 'sig-102',
    pair: 'EUR/USD',
    direction: 'NO_TRADE',
    timeframe: 'M15',
    strategy: 'Market Choppiness Filter',
    confidence: 94,
    status: 'DISMISSED',
    timestamp: 'Yesterday 14:00 GMT',
    analysisReasoning: 'Choppiness Index > 62.0 inside tight consolidation ahead of ECB rate remarks. Capital preserved.'
  },
  {
    id: 'sig-103',
    pair: 'US30',
    direction: 'SELL',
    timeframe: 'M5 / M15',
    strategy: 'ICT Silver Bullet',
    entryPrice: 43920,
    stopLoss: 44010,
    takeProfit: 43680,
    riskReward: '1 : 2.67',
    confidence: 85,
    status: 'EXECUTED',
    timestamp: '2 Days Ago 15:30 GMT',
    analysisReasoning: 'New York open fair value gap rejection after creating equal highs liquidity inducement.'
  }
];

export const Features: React.FC = () => {
  // Interactive Risk Calculator states
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [stopLossPips, setStopLossPips] = useState<number>(25);

  const riskAmount = (balance * riskPercent) / 100;
  // Standard FX lot formula approx: Lot size = Risk Amount / (Stop loss in pips * 10)
  const estimatedLotSize = Math.max(0.01, +(riskAmount / (stopLossPips * 10)).toFixed(2));

  // Active economic event tab
  const [selectedEventTag, setSelectedEventTag] = useState<'CPI' | 'PPI' | 'NFP' | 'FOMC'>('CPI');
  const activeEvent = sampleEconomicEvents.find((e) => e.tag === selectedEventTag) || sampleEconomicEvents[0];

  return (
    <section id="features" className="py-20 bg-[#101B20] text-[#E8F2EE] relative border-t border-[#152B30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#152B30] border border-[#16A36A]/30 text-xs font-mono text-[#16A36A]">
            <span>ENGINE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#E8F2EE]">
            Engineered for Precision.{' '}
            <span className="purple-glow-text text-[#E8F2EE]">Built for Discipline.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#A9BEB5] leading-relaxed">
            Every feature in PipPilotAi is created to eliminate emotion, identify structured confluences, and preserve trading capital in all market environments.
          </p>
        </div>

        {/* Feature 1: Intelligent Market Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#16A36A]/15 border border-[#16A36A]/30 flex items-center justify-center text-[#16A36A]">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#E8F2EE]">
              Intelligent Market Analysis
            </h3>
            <p className="text-[#A9BEB5] leading-relaxed">
              PipPilotAi decodes institutional footprint across multi-timeframe horizons. Instead of relying on lagging retail indicators alone, the engine unifies proven institutional concepts into one cohesive algorithmic framework.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#152B30] border border-[#1A363E]">
                <h4 className="text-xs font-bold text-[#16A36A] uppercase tracking-wider mb-1">
                  Smart Money Concepts (SMC)
                </h4>
                <p className="text-xs text-[#A9BEB5]">
                  Automated tracking of Order Blocks (OB), Break of Structure (BOS), and Change of Character (CHoCH).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#152B30] border border-[#1A363E]">
                <h4 className="text-xs font-bold text-[#168BFF] uppercase tracking-wider mb-1">
                  ICT Concepts
                </h4>
                <p className="text-xs text-[#A9BEB5]">
                  Fair Value Gaps (FVG), London/NY Kill Zones, liquidity pool purges, and Premium/Discount equilibrium.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#152B30] border border-[#1A363E]">
                <h4 className="text-xs font-bold text-[#9560E8] uppercase tracking-wider mb-1">
                  CRT Setups
                </h4>
                <p className="text-xs text-[#A9BEB5]">
                  Candle Range Theory: tracking higher timeframe expansion, initial balance sweeps, and continuation ranges.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#152B30] border border-[#1A363E]">
                <h4 className="text-xs font-bold text-[#E8F2EE] uppercase tracking-wider mb-1">
                  Multi-Timeframe Confluence
                </h4>
                <p className="text-xs text-[#A9BEB5]">
                  Daily/H4 macro trend filtering synchronized with H1/M15 execution levels to prevent counter-trend traps.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#152B30] border border-[#1A363E] rounded-2xl p-6 purple-glow-box space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-semibold text-[#A9BEB5]">MULTI-TIMEFRAME SYNC</span>
              <span className="text-xs font-mono text-[#16A36A] bg-[#16A36A]/10 px-2 py-0.5 rounded border border-[#16A36A]/30">
                Triple Alignment
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
                <div>
                  <span className="text-[#A9BEB5] block text-[11px]">Daily (D1) Trend Filter</span>
                  <span className="text-[#E8F2EE] font-bold">Bullish Market Structure</span>
                </div>
                <span className="px-2 py-1 rounded bg-[#16A36A]/20 text-[#16A36A] text-[11px] font-bold">
                  BOS Up
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
                <div>
                  <span className="text-[#A9BEB5] block text-[11px]">Hourly (H1) Liquidity Sweep</span>
                  <span className="text-[#E8F2EE] font-bold">Asian Session Low Taken</span>
                </div>
                <span className="px-2 py-1 rounded bg-[#168BFF]/20 text-[#168BFF] text-[11px] font-bold">
                  Sweep Confirmed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
                <div>
                  <span className="text-[#A9BEB5] block text-[11px]">15-Minute (M15) Trigger</span>
                  <span className="text-[#E8F2EE] font-bold">Fair Value Gap Retest</span>
                </div>
                <span className="px-2 py-1 rounded bg-[#9560E8]/20 text-[#9560E8] text-[11px] font-bold">
                  FVG Mitigated
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-[#A9BEB5] bg-[#101B20]/60 p-3 rounded-xl border border-[#1A363E]/60 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#16A36A] shrink-0" />
              <span>Higher timeframe context validates the lower timeframe trigger before any notification is broadcast.</span>
            </div>
          </div>
        </div>

        {/* Feature 2: AI Trading Intelligence & 'NO TRADE' Shield */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#9560E8]/15 border border-[#9560E8]/30 flex items-center justify-center text-[#9560E8]">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#E8F2EE]">
              AI Trading Intelligence & Capital Shield
            </h3>
            <p className="text-[#A9BEB5] leading-relaxed">
              Most trading software forces signals regardless of market quality. PipPilotAi is built on an opposing philosophy: the best trade is often no trade.
            </p>
            <p className="text-[#A9BEB5] leading-relaxed">
              When volatility is chaotic, economic releases are imminent, or directional bias is contested, the system proactively returns <strong className="text-[#E69A36]">NO TRADE</strong> to shield your balance from unnecessary churn.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-[#E69A36]/15 text-[#E69A36] mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#E8F2EE]">Choppiness Rejection</h4>
                  <p className="text-xs text-[#A9BEB5]">
                    Consolidation ranges with low volume or unpredictable whipsaws trigger an automatic standby flag.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-[#16A36A]/15 text-[#16A36A] mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#E8F2EE]">High-Confluence Filter</h4>
                  <p className="text-xs text-[#A9BEB5]">
                    Only opportunities meeting minimum risk/reward ratios (&gt;1:2.0) and structural backing are presented.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:order-1 bg-[#152B30] border border-[#E69A36]/30 rounded-2xl p-6 purple-glow-box space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-bold text-[#E69A36] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> SYSTEM BEHAVIOUR LOG
              </span>
              <span className="text-[11px] font-mono text-[#A9BEB5]">Live Assessment</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E8F2EE]">Asset: GBP/USD M15</span>
                  <span className="px-2 py-0.5 rounded bg-[#E69A36]/20 text-[#E69A36] font-bold text-[10px]">
                    SETUP REJECTED
                  </span>
                </div>
                <div className="space-y-1 text-[#A9BEB5] text-[11px]">
                  <p>• Structure: Unclear range; high-timeframe trend in conflict.</p>
                  <p>• Liquidity: Sell-side liquidity not yet swept.</p>
                  <p>• Volatility: Average True Range (ATR) compressed below optimal threshold.</p>
                </div>
                <div className="pt-2 border-t border-[#1A363E] flex items-center justify-between text-[#E69A36] font-semibold text-[11px]">
                  <span>System Decision:</span>
                  <span>'NO TRADE' — Await session expansion</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#101B20] border border-[#16A36A]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E8F2EE]">Asset: XAU/USD H1</span>
                  <span className="px-2 py-0.5 rounded bg-[#16A36A]/20 text-[#16A36A] font-bold text-[10px]">
                    SETUP APPROVED
                  </span>
                </div>
                <div className="space-y-1 text-[#A9BEB5] text-[11px]">
                  <p>• Structure: Clear bullish shift after liquidity raid.</p>
                  <p>• Confluence: 1.0% defined risk with 1:2.8 risk-to-reward target.</p>
                </div>
                <div className="pt-2 border-t border-[#1A363E] flex items-center justify-between text-[#16A36A] font-semibold text-[11px]">
                  <span>System Decision:</span>
                  <span>Pending Trader Human Approval</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: MT5 Integration & Semi-Automated Workflow */}
        <div className="space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#168BFF]/10 border border-[#168BFF]/30 text-xs font-mono text-[#168BFF]">
              <Workflow className="w-3.5 h-3.5" />
              <span>PLANNED PLATFORM CAPABILITY</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#E8F2EE]">
              Semi-Automated MT5 Execution Architecture
            </h3>
            <p className="text-[#A9BEB5] leading-relaxed">
              PipPilotAi is designed for semi-automated trading. The platform never places unmonitored blind orders. You remain in complete command at every step.
            </p>
          </div>

          {/* 4-Step Visual Workflow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 relative space-y-3 hover:border-[#168BFF]/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#168BFF]/20 text-[#168BFF] font-mono font-bold flex items-center justify-center text-sm">
                  01
                </span>
                <span className="text-[10px] font-mono text-[#A9BEB5] uppercase">Analysis</span>
              </div>
              <h4 className="text-base font-bold text-[#E8F2EE]">PipPilotAi Analyses</h4>
              <p className="text-xs text-[#A9BEB5] leading-relaxed">
                Algorithmic engine monitors market structure, institutional liquidity pools, and economic indicators across key pairs.
              </p>
            </div>

            <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 relative space-y-3 hover:border-[#168BFF]/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#9560E8]/20 text-[#9560E8] font-mono font-bold flex items-center justify-center text-sm">
                  02
                </span>
                <span className="text-[10px] font-mono text-[#A9BEB5] uppercase">Generation</span>
              </div>
              <h4 className="text-base font-bold text-[#E8F2EE]">Setup Generated</h4>
              <p className="text-xs text-[#A9BEB5] leading-relaxed">
                A potential trade proposal is formulated with explicit Entry, Stop Loss, Take Profit, and calculated risk parameters.
              </p>
            </div>

            <div className="bg-[#152B30] border border-[#16A36A]/50 rounded-2xl p-5 relative space-y-3 emerald-glow">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#16A36A]/20 text-[#16A36A] font-mono font-bold flex items-center justify-center text-sm">
                  03
                </span>
                <span className="text-[10px] font-mono text-[#16A36A] font-bold uppercase">Human Control</span>
              </div>
              <h4 className="text-base font-bold text-[#E8F2EE]">Trader Review</h4>
              <p className="text-xs text-[#A9BEB5] leading-relaxed">
                The trader reviews setup rationale, checks risk levels, and explicitly approves or rejects the setup. No blind execution.
              </p>
            </div>

            <div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 relative space-y-3 hover:border-[#168BFF]/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#168BFF]/20 text-[#168BFF] font-mono font-bold flex items-center justify-center text-sm">
                  04
                </span>
                <span className="text-[10px] font-mono text-[#A9BEB5] uppercase">MT5 Client</span>
              </div>
              <h4 className="text-base font-bold text-[#E8F2EE]">Independent Validation</h4>
              <p className="text-xs text-[#A9BEB5] leading-relaxed">
                The MT5 execution component independently double-checks broker spread, slippage tolerances, and local risk rules before transmission.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#152B30]/60 border border-[#1A363E] text-xs text-[#A9BEB5] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#168BFF]" />
            <p>
              <strong className="text-[#E8F2EE]">Integration Notice:</strong> MT5 connectivity and local bridge execution are planned capabilities actively in development. Public landing page preview illustrates planned software workflow.
            </p>
          </div>
        </div>

        {/* Feature 4: Economic News Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#168BFF]/15 border border-[#168BFF]/30 flex items-center justify-center text-[#168BFF]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#E8F2EE]">
              Economic News Intelligence
            </h3>
            <p className="text-[#A9BEB5] leading-relaxed">
              Macroeconomic releases trigger the largest volatility spikes in financial markets. PipPilotAi evaluates upcoming calendar milestones, consensus forecasts, and possible asset implications.
            </p>

            <div className="flex flex-wrap gap-2">
              {(['CPI', 'PPI', 'NFP', 'FOMC'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedEventTag(tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    selectedEventTag === tag
                      ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE] shadow-md shadow-[#168BFF]/30'
                      : 'bg-[#152B30] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] hover:border-[#168BFF]/40'
                  }`}
                >
                  {tag} Event Insight
                </button>
              ))}
            </div>

            <div className="bg-[#152B30] border border-[#1A363E] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#E8F2EE]">{activeEvent.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30 uppercase">
                  {activeEvent.impact} Impact
                </span>
              </div>
              <p className="text-xs text-[#A9BEB5]">{activeEvent.biasNote}</p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#168BFF]">
                <span>Monitored Assets:</span>
                <span className="text-[#E8F2EE]">{activeEvent.affectedAssets.join(', ')}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#A9BEB5] italic">
              Note: News intelligence is provided for contextual market preparedness. PipPilotAi does not guarantee release numbers or market directional outcomes.
            </p>
          </div>

          <div className="lg:col-span-6 bg-[#152B30] border border-[#1A363E] rounded-2xl p-6 purple-glow-box space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#A9BEB5] uppercase tracking-wider flex items-center justify-between">
              <span>Core Macro Radar</span>
              <span className="text-[#16A36A]">Scheduled Monitoring</span>
            </h4>

            <div className="space-y-2.5">
              {sampleEconomicEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventTag(evt.tag)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedEventTag === evt.tag
                      ? 'bg-[#101B20] border-[#168BFF] shadow-sm'
                      : 'bg-[#101B20]/60 border-[#1A363E] hover:border-[#1A363E]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#E8F2EE]">{evt.tag}</span>
                    <span className="text-[11px] font-mono text-[#A9BEB5]">{evt.date}</span>
                  </div>
                  <p className="text-xs text-[#A9BEB5] mt-1 font-medium truncate">{evt.name}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5] pt-1 border-t border-[#1A363E]/40">
                    <span>Prev: <strong className="text-[#E8F2EE]">{evt.previous}</strong></span>
                    <span>Consensus: <strong className="text-[#168BFF]">{evt.forecast}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature 5: Risk Management with Interactive Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#16A36A]/15 border border-[#16A36A]/30 flex items-center justify-center text-[#16A36A]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#E8F2EE]">
              Disciplined Risk Management
            </h3>
            <p className="text-[#A9BEB5] leading-relaxed">
              Longevity in trading is governed by risk control, not win rate alone. PipPilotAi embeds institutional risk frameworks into every recommendation:
            </p>

            <ul className="space-y-2.5 text-xs text-[#A9BEB5]">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span><strong className="text-[#E8F2EE]">Dynamic Position Sizing:</strong> Calculates exact lot size based on balance and stop-loss distance.</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span><strong className="text-[#E8F2EE]">Stop-Loss Validation:</strong> Mandatory invalidation level prior to any setup generation.</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span><strong className="text-[#E8F2EE]">Daily Loss Limit:</strong> Soft and hard limits to halt trading on drawdown boundaries.</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span><strong className="text-[#E8F2EE]">Exposure Controls:</strong> Prevents excessive correlated asset risk across currency blocks.</span>
              </li>
            </ul>
          </div>

          {/* Interactive Lot Size / Risk Simulator */}
          <div className="lg:col-span-6 bg-[#152B30] border border-[#16A36A]/30 rounded-2xl p-6 purple-glow-box space-y-5">
            <div className="flex items-center justify-between border-b border-[#1A363E] pb-3">
              <span className="text-xs font-mono font-bold text-[#16A36A] flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> RISK SIZE SIMULATOR
              </span>
              <span className="text-[11px] font-mono text-[#A9BEB5]">Institutional Formula</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A9BEB5]">Account Balance</span>
                  <span className="text-[#E8F2EE] font-bold">${balance.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-full accent-[#16A36A] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A9BEB5]">Risk Per Trade (%)</span>
                  <span className="text-[#16A36A] font-bold">{riskPercent.toFixed(1)}%</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setRiskPercent(pct)}
                      className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                        riskPercent === pct
                          ? 'bg-[#16A36A] text-[#E8F2EE] border-[#16A36A]'
                          : 'bg-[#101B20] text-[#A9BEB5] border-[#1A363E] hover:text-[#E8F2EE]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A9BEB5]">Stop-Loss Distance</span>
                  <span className="text-[#E8F2EE] font-bold">{stopLossPips} Pips</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={5}
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(Number(e.target.value))}
                  className="w-full accent-[#168BFF] cursor-pointer"
                />
              </div>

              {/* Calculated Outputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
                  <span className="text-[10px] text-[#A9BEB5] uppercase block">Risk in Dollars</span>
                  <span className="text-base font-bold text-[#E05252]">${riskAmount.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#101B20] border border-[#16A36A]/40">
                  <span className="text-[10px] text-[#A9BEB5] uppercase block">Validated Lot Size</span>
                  <span className="text-base font-bold text-[#16A36A]">{estimatedLotSize} Lots</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 6: Signal History and Performance */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#152B30] border border-[#1A363E] text-xs font-mono text-[#A9BEB5]">
                <History className="w-3.5 h-3.5 text-[#168BFF]" />
                <span>TRANSPARENT RECORD</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#E8F2EE]">
                Signal History & Outcome Review
              </h3>
              <p className="text-sm text-[#A9BEB5]">
                Members will be able to review recent signals, execution telemetry, and outcome analytics. Every trade proposal is logged with structural reasoning.
              </p>
            </div>
            <div className="text-xs font-mono text-[#A9BEB5]">
              Zero fabricated claims • Documented R:R
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {samplePastSignals.map((sig) => (
              <div
                key={sig.id}
                className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4 hover:border-[#168BFF]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#E8F2EE]">{sig.pair}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      sig.direction === 'BUY'
                        ? 'bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/30'
                        : sig.direction === 'SELL'
                        ? 'bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30'
                        : 'bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/30'
                    }`}
                  >
                    {sig.direction === 'NO_TRADE' ? 'FILTERED' : sig.direction}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#168BFF] font-semibold">{sig.strategy}</span>
                  <p className="text-xs text-[#A9BEB5] leading-relaxed line-clamp-3">
                    {sig.analysisReasoning}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1A363E] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#A9BEB5]">{sig.timeframe}</span>
                  {sig.riskReward && (
                    <span className="text-[#16A36A] font-semibold">{sig.riskReward}</span>
                  )}
                  <span className="text-[11px] text-[#A9BEB5]">{sig.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
