import type { TradingCandle, TradingTimeframe } from "@workspace/api-zod";

export interface ProviderSymbol {
  symbol: string;
  exchange?: string;
}

export interface ProviderQuote {
  symbol: string;
  exchange: string | null;
  price: number;
  timestamp: number;
  marketOpen: boolean | null;
}

export interface ProviderCandleSeries {
  symbol: string;
  exchange: string | null;
  exchangeTimezone: string;
  candles: TradingCandle[];
}

export interface MarketDataProvider {
  readonly id: "twelvedata";
  readonly name: "Twelve Data";
  fetchQuote(instrument: ProviderSymbol): Promise<ProviderQuote>;
  fetchCandles(
    instrument: ProviderSymbol,
    timeframe: TradingTimeframe,
  ): Promise<ProviderCandleSeries>;
}

export type MarketDataFailureKind =
  | "timeout"
  | "rate_limited"
  | "unavailable"
  | "invalid_response"
  | "unsupported_symbol"
  | "not_configured";

export class MarketDataProviderError extends Error {
  constructor(
    readonly kind: MarketDataFailureKind,
    message: string,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "MarketDataProviderError";
  }
}
