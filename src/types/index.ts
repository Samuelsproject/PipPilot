export type NavigationRoute = '/' | '/app' | '/register';

export interface EconomicEvent {
  id: string;
  name: string;
  tag: 'CPI' | 'PPI' | 'NFP' | 'FOMC';
  impact: 'High' | 'Critical';
  date: string;
  previous: string;
  forecast: string;
  affectedAssets: string[];
  biasNote: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL' | 'NO_TRADE';
  timeframe: string;
  strategy: 'SMC Order Block' | 'ICT Silver Bullet' | 'CRT Range Expansion' | 'Market Choppiness Filter';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: string;
  confidence: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'DISMISSED';
  timestamp: string;
  analysisReasoning: string;
}

export interface RiskCalculation {
  accountBalance: number;
  riskPercent: number;
  stopLossPips: number;
  asset: string;
  calculatedLotSize: number;
  riskAmountUsd: number;
}
