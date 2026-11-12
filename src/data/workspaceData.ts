import { EconomicEvent, TradingSignal } from '../types';

export const MAX_SHARED_SIGNALS = 10;

export type AssetSymbol = 'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'US30';
export type TimeframeOption = 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export interface AssetOverview {
  symbol: AssetSymbol;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  bias: string;
  crtHigh: string;
  crtLow: string;
  regime: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  confluenceNote: string;
}

export const SAMPLE_WATCHLIST: AssetOverview[] = [
  {
    symbol: 'XAU/USD',
    name: 'Gold Spot / USD',
    price: '2,648.40',
    change: '+0.64%',
    positive: true,
    bias: 'Bullish SMC',
    crtHigh: '2,654.00',
    crtLow: '2,638.50',
    regime: 'Trend Expansion',
    entry: '2,644.20',
    stopLoss: '2,639.80',
    takeProfit: '2,656.50',
    riskReward: '1 : 2.8',
    confluenceNote:
      'H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.',
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    price: '1.0842',
    change: '-0.12%',
    positive: false,
    bias: 'Neutral ICT',
    crtHigh: '1.0875',
    crtLow: '1.0810',
    regime: 'Pre-Catalyst Range',
    entry: '1.0835',
    stopLoss: '1.0812',
    takeProfit: '1.0890',
    riskReward: '1 : 2.4',
    confluenceNote:
      'Asian range sweep tested; awaiting New York open displacement confirmation.',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / USD',
    price: '1.2985',
    change: '+0.28%',
    positive: true,
    bias: 'Bullish BOS',
    crtHigh: '1.3018',
    crtLow: '1.2940',
    regime: 'Session Reclaim',
    entry: '1.2968',
    stopLoss: '1.2944',
    takeProfit: '1.3030',
    riskReward: '1 : 2.6',
    confluenceNote:
      'London Break of Structure confirmed above prior day midpoint equilibrium.',
  },
  {
    symbol: 'US30',
    name: 'Dow Jones Index',
    price: '43,890.10',
    change: '+0.45%',
    positive: true,
    bias: 'Bullish Expansion',
    crtHigh: '44,020.00',
    crtLow: '43,650.00',
    regime: 'NY Open Momentum',
    entry: '43,810.00',
    stopLoss: '43,690.00',
    takeProfit: '44,110.00',
    riskReward: '1 : 2.5',
    confluenceNote:
      'New York kill-zone FVG mitigation aligned with H4 bullish orderflow.',
  },
];

export const CORE_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'eco-cpi',
    name: 'Consumer Price Index (CPI YoY)',
    tag: 'CPI',
    impact: 'Critical',
    date: 'Wednesday 12:30 GMT',
    previous: '3.1%',
    forecast: '2.9%',
    affectedAssets: ['XAU/USD', 'EUR/USD', 'US30'],
    biasNote:
      'Higher-than-expected inflation typically strengthens USD; gold may test discount liquidity levels.',
  },
  {
    id: 'eco-ppi',
    name: 'Producer Price Index (PPI MoM)',
    tag: 'PPI',
    impact: 'High',
    date: 'Thursday 12:30 GMT',
    previous: '0.2%',
    forecast: '0.1%',
    affectedAssets: ['USD Pairs', 'Treasuries'],
    biasNote:
      'Leading indicator for wholesale price pressure and upstream inflation trajectory.',
  },
  {
    id: 'eco-nfp',
    name: 'Non-Farm Payrolls (NFP) & Unemployment',
    tag: 'NFP',
    impact: 'Critical',
    date: 'First Friday 12:30 GMT',
    previous: '185K',
    forecast: '170K',
    affectedAssets: ['DXY', 'GBP/USD', 'US30'],
    biasNote:
      'Extreme volatility window. Platform pre-event protection activates 30 minutes prior.',
  },
  {
    id: 'eco-fomc',
    name: 'FOMC Rate Decision & Press Conference',
    tag: 'FOMC',
    impact: 'Critical',
    date: 'Federal Reserve Cycle',
    previous: '5.25%',
    forecast: '5.00%',
    affectedAssets: ['All Major FX', 'Indices', 'Gold'],
    biasNote:
      'Macro policy guidance shifts institutional liquidity parameters across higher timeframes.',
  },
];

// Preserves the maximum of 10 shared platform signals
const RAW_SHARED_SIGNALS: TradingSignal[] = [
  {
    id: 'SIG-842',
    pair: 'XAU/USD',
    direction: 'BUY',
    timeframe: 'H1 / M15',
    strategy: 'SMC Order Block',
    entryPrice: 2644.2,
    stopLoss: 2639.8,
    takeProfit: 2656.5,
    riskReward: '1 : 2.8',
    confidence: 89,
    status: 'PENDING_APPROVAL',
    outcome: 'PENDING',
    timestamp: 'Today 09:45 GMT',
    analysisReasoning:
      'H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.',
  },
  {
    id: 'SIG-841',
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
    outcome: 'TP_HIT',
    timestamp: 'Yesterday 09:15 GMT',
    analysisReasoning:
      'London session liquidity sweep below 2635, retested H1 bullish order block with clean displacement.',
  },
  {
    id: 'SIG-840',
    pair: 'EUR/USD',
    direction: 'NO_TRADE',
    timeframe: 'M15',
    strategy: 'Market Choppiness Filter',
    confidence: 94,
    status: 'DISMISSED',
    outcome: 'PROTECTED',
    timestamp: 'Yesterday 14:00 GMT',
    analysisReasoning:
      'Choppiness Index > 62.0 inside tight consolidation ahead of ECB rate remarks. Capital preserved.',
  },
  {
    id: 'SIG-839',
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
    outcome: 'TP_HIT',
    timestamp: '2 Days Ago 15:30 GMT',
    analysisReasoning:
      'New York open fair value gap rejection after creating equal highs liquidity inducement.',
  },
  {
    id: 'SIG-838',
    pair: 'GBP/USD',
    direction: 'BUY',
    timeframe: 'H1 / M15',
    strategy: 'CRT Range Expansion',
    entryPrice: 1.2945,
    stopLoss: 1.2920,
    takeProfit: 1.3005,
    riskReward: '1 : 2.40',
    confidence: 84,
    status: 'APPROVED',
    outcome: 'BREAKEVEN',
    timestamp: '3 Days Ago 08:40 GMT',
    analysisReasoning:
      'CRT initial balance sweep followed by clean M15 displacement reclaim above session open.',
  },
  {
    id: 'SIG-837',
    pair: 'EUR/USD',
    direction: 'SELL',
    timeframe: 'H4 / H1',
    strategy: 'SMC Order Block',
    entryPrice: 1.0892,
    stopLoss: 1.0915,
    takeProfit: 1.0835,
    riskReward: '1 : 2.48',
    confidence: 82,
    status: 'EXECUTED',
    outcome: 'SL_HIT',
    timestamp: '4 Days Ago 13:10 GMT',
    analysisReasoning:
      'H4 bearish breaker retest invalidated during sudden US Treasury yield reversal.',
  },
  {
    id: 'SIG-836',
    pair: 'GBP/USD',
    direction: 'NO_TRADE',
    timeframe: 'M15',
    strategy: 'Market Choppiness Filter',
    confidence: 91,
    status: 'DISMISSED',
    outcome: 'PROTECTED',
    timestamp: '5 Days Ago 11:20 GMT',
    analysisReasoning:
      'Conflicted M15 vs H4 orderflow and widened broker spread ahead of US PPI print.',
  },
  {
    id: 'SIG-835',
    pair: 'XAU/USD',
    direction: 'SELL',
    timeframe: 'M15',
    strategy: 'ICT Silver Bullet',
    entryPrice: 2661.0,
    stopLoss: 2666.5,
    takeProfit: 2647.0,
    riskReward: '1 : 2.55',
    confidence: 87,
    status: 'REJECTED',
    outcome: 'PROTECTED',
    timestamp: '6 Days Ago 15:15 GMT',
    analysisReasoning:
      'Trader declined setup due to personal exposure limit prior to London Fix.',
  },
  {
    id: 'SIG-834',
    pair: 'US30',
    direction: 'BUY',
    timeframe: 'H1 / M15',
    strategy: 'CRT Range Expansion',
    entryPrice: 43540,
    stopLoss: 43420,
    takeProfit: 43840,
    riskReward: '1 : 2.50',
    confidence: 86,
    status: 'EXECUTED',
    outcome: 'TP_HIT',
    timestamp: '1 Week Ago 14:45 GMT',
    analysisReasoning:
      'Swept prior day low liquidity with bullish CRT range expansion into New York afternoon.',
  },
  {
    id: 'SIG-833',
    pair: 'EUR/USD',
    direction: 'BUY',
    timeframe: 'H1',
    strategy: 'SMC Order Block',
    entryPrice: 1.0795,
    stopLoss: 1.0772,
    takeProfit: 1.0852,
    riskReward: '1 : 2.48',
    confidence: 83,
    status: 'EXECUTED',
    outcome: 'TP_HIT',
    timestamp: '1 Week Ago 08:15 GMT',
    analysisReasoning:
      'Daily demand discount alignment with London session CHoCH confirmation.',
  },
];

export const SHARED_PLATFORM_SIGNALS: TradingSignal[] = RAW_SHARED_SIGNALS.slice(
  0,
  MAX_SHARED_SIGNALS
);

export const STRATEGY_MODULES = [
  {
    id: 'smc',
    code: 'SMC',
    name: 'Smart Money Concepts',
    accent: '#16A36A',
    cadence: 'Intraday & Swing',
    summary:
      'Tracks institutional Order Blocks (OB), Break of Structure (BOS), and Change of Character (CHoCH) across H4, H1, and M15.',
    rules: [
      'Higher-timeframe (D1/H4) market structure defines directional bias',
      'BOS confirms continuation; CHoCH flags structural shift after liquidity raid',
      'Mitigation entry inside unmitigated Order Block with strict invalidation',
    ],
  },
  {
    id: 'ict',
    code: 'ICT',
    name: 'ICT Concepts & Silver Bullet',
    accent: '#168BFF',
    cadence: 'Intraday Kill Zones',
    summary:
      'Evaluates Fair Value Gaps (FVG), London/New York Kill Zones, liquidity pool purges, and Premium/Discount equilibrium.',
    rules: [
      'Requires clean buy-side or sell-side liquidity sweep prior to displacement',
      'Targets FVG rebalance inside high-volume London (07:00–10:00) or NY (13:30–16:00) windows',
      'Enforces discount buys and premium shorts relative to dealing range',
    ],
  },
  {
    id: 'crt',
    code: 'CRT',
    name: 'Candle Range Theory',
    accent: '#9560E8',
    cadence: 'Swing & Session Expansion',
    summary:
      'Models higher-timeframe candle range boundaries, initial balance false breaks, and directional expansion continuations.',
    rules: [
      'Identifies prior session/day high-low range manipulation (turtle soup)',
      'Confirms body close back inside range before targeting opposing range extreme',
      'Pairs H4 range framing with M15 execution refinement',
    ],
  },
  {
    id: 'indicators',
    code: 'IND',
    name: 'Quantitative Indicators & Filters',
    accent: '#E69A36',
    cadence: 'Cross-Regime Guardrail',
    summary:
      'Supplements price-action structure with Choppiness Index, ATR volatility compression thresholds, and RSI divergence checks.',
    rules: [
      'Choppiness Index > 60.0 flags sideways noise and blocks low-edge entries',
      'ATR threshold guards against dead liquidity and excessive spread ratios',
      'Minimum 1:2.0 Risk-to-Reward required before setup publication',
    ],
  },
];

export const FAQ_ITEMS = [
  {
    q: 'Why does PipPilotAi require administrator approval after email verification?',
    a: 'Email verification confirms identity ownership (Step 2). Membership access (Step 3) is manually reviewed and activated by administrators to control cohort capacity and maintain execution quality.',
  },
  {
    q: 'Does PipPilotAi automatically place live trades without my permission?',
    a: 'No. PipPilotAi uses a semi-automated 4-step workflow: Analysis -> Setup Proposal -> Human Trader Review -> Independent MT5 Validation. Nothing is transmitted unless you explicitly approve it.',
  },
  {
    q: 'What does a NO TRADE signal mean?',
    a: 'When market choppiness is high, multi-timeframe structure conflicts, or a critical news catalyst (CPI, PPI, NFP, FOMC) is imminent, the Capital Shield issues a NO TRADE status to protect your account from low-probability noise.',
  },
  {
    q: 'Is MetaTrader 5 (MT5) execution live right now?',
    a: 'Not yet. The MT5 execution bridge is currently in active development and not connected to live broker terminals. All signals, prices, and validation steps in the workspace are currently illustrative previews.',
  },
  {
    q: 'Why is Signal History capped at 10 shared platform signals?',
    a: 'PipPilotAi prioritizes high-confluence selectivity over signal spam and preserves a clean, auditable rolling feed of up to 10 shared platform signals for transparent review.',
  },
];
