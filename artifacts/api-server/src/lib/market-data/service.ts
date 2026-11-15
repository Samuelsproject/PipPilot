import type {
  MarketDataAnalysisResponse,
  MarketDataErrorResponse,
  MarketDataProviderStatusResponse,
  MarketDataProviderStatusResponseConnectionState,
  MarketDataProviderStatusResponseDataMode,
  MarketDataQuote,
  TradingAnalysisInputTimeframes,
  TradingAnalysisResponse,
  TradingTimeframe,
} from "@workspace/api-zod";
import { analyzeTrading } from "../trading-analysis";
import {
  createProviderFromConfiguration,
  readMarketDataConfiguration,
  resolveTwelveDataSymbol,
  statusResponse,
  type TwelveDataConfiguration,
} from "./config";
import {
  MarketDataProviderError,
  type MarketDataProvider,
  type ProviderCandleSeries,
  type ProviderQuote,
  type ProviderSymbol,
} from "./types";

const TIMEFRAMES: readonly TradingTimeframe[] = ["1D", "4H", "1H", "30M"];
const ANALYSIS_CREDIT_COST = 5;
const CACHE_TTL_MS = 15_000;
const USER_WINDOW_MS = 60_000;
const USER_REQUEST_LIMIT = 5;
const USER_MIN_INTERVAL_MS = 10_000;
const FRESH_QUOTE_MAX_AGE_MS = 5 * 60_000;
const CRYPTO_QUOTE_MAX_AGE_MS = 2 * 60_000;
const CONNECTION_FRESHNESS_MS = 2 * 60_000;

interface CachedBundle {
  cachedAt: number;
  quote: ProviderQuote | null;
  series: Partial<Record<TradingTimeframe, ProviderCandleSeries>>;
}

interface UsageEntry {
  timestamp: number;
  utcDay: string;
  credits: number;
}

export class MarketDataServiceError extends Error {
  constructor(
    readonly statusCode: number,
    readonly response: MarketDataErrorResponse,
    readonly logCode: string,
  ) {
    super(response.error);
    this.name = "MarketDataServiceError";
  }
}

function errorResponse(
  code: MarketDataErrorResponse["code"],
  error: string,
  retryAfterSeconds: number | null = null,
): MarketDataErrorResponse {
  return { code, error, retryAfterSeconds };
}

function asServiceError(error: unknown): MarketDataServiceError {
  if (!(error instanceof MarketDataProviderError)) {
    return new MarketDataServiceError(
      503,
      errorResponse("PROVIDER_UNAVAILABLE", "Market data is temporarily unavailable."),
      "unexpected_provider_error",
    );
  }
  if (error.kind === "unsupported_symbol") {
    return new MarketDataServiceError(
      400,
      errorResponse(
        "SYMBOL_UNSUPPORTED",
        "This instrument has no verified provider mapping. Configure an exact provider symbol before requesting data.",
      ),
      "unsupported_symbol",
    );
  }
  if (error.kind === "timeout") {
    return new MarketDataServiceError(
      504,
      errorResponse("PROVIDER_TIMEOUT", "The market-data provider timed out."),
      "provider_timeout",
    );
  }
  if (error.kind === "rate_limited") {
    return new MarketDataServiceError(
      429,
      errorResponse(
        "PROVIDER_RATE_LIMITED",
        "The provider limit was reached. Wait before requesting market data again.",
        error.retryAfterSeconds,
      ),
      "provider_rate_limited",
    );
  }
  if (error.kind === "not_configured") {
    return new MarketDataServiceError(
      503,
      errorResponse(
        "PROVIDER_NOT_CONFIGURED",
        "Market data is not configured. CSV imports remain available.",
      ),
      "provider_not_configured",
    );
  }
  if (error.kind === "invalid_response") {
    return new MarketDataServiceError(
      503,
      errorResponse(
        "PROVIDER_DATA_INVALID",
        "The provider returned invalid market data. No signal was generated.",
      ),
      "provider_data_invalid",
    );
  }
  return new MarketDataServiceError(
    503,
    errorResponse("PROVIDER_UNAVAILABLE", "The market-data provider is unavailable."),
    "provider_unavailable",
  );
}

function forceNoTrade(
  signal: TradingAnalysisResponse["signal"],
  status: "valid" | "stale" | "unavailable",
  reason: string,
): TradingAnalysisResponse["signal"] {
  return {
    ...signal,
    decision: "NO_TRADE",
    status,
    entryPrice: null,
    entryLow: null,
    entryHigh: null,
    stopLoss: null,
    targets: [],
    confidence: 0,
    confidenceExplanation: reason,
    evidence: [],
    invalidationConditions: [
      "Re-fetch valid, current market data before evaluating another setup.",
      "No order was placed; this response is not an execution instruction.",
    ],
    expiresAt: null,
  };
}

class ProviderUsageBudget {
  private entries: UsageEntry[] = [];

  reserve(now: number, credits: number, config: TwelveDataConfiguration): number | null {
    const cutoff = now - 60_000;
    const utcDay = new Date(now).toISOString().slice(0, 10);
    this.entries = this.entries.filter(
      (entry) => entry.timestamp > cutoff || entry.utcDay === utcDay,
    );
    const minuteUsage = this.entries
      .filter((entry) => entry.timestamp > cutoff)
      .reduce((sum, entry) => sum + entry.credits, 0);
    const dailyUsage = this.entries
      .filter((entry) => entry.utcDay === utcDay)
      .reduce((sum, entry) => sum + entry.credits, 0);
    if (dailyUsage + credits > config.creditsPerDay) {
      return 60;
    }
    if (minuteUsage + credits > config.creditsPerMinute) {
      const oldest = this.entries
        .filter((entry) => entry.timestamp > cutoff)
        .sort((left, right) => left.timestamp - right.timestamp)[0];
      return oldest ? Math.max(1, Math.ceil((oldest.timestamp + 60_000 - now) / 1_000)) : 60;
    }
    this.entries.push({ timestamp: now, utcDay, credits });
    return null;
  }
}

export interface MarketDataServiceOptions {
  env?: Record<string, string | undefined>;
  clock?: () => number;
  fetcher?: typeof fetch;
  provider?: MarketDataProvider | null;
}

export class MarketDataService {
  private readonly env: Record<string, string | undefined>;
  private readonly clock: () => number;
  private readonly config: ReturnType<typeof readMarketDataConfiguration>;
  private readonly provider: MarketDataProvider | null;
  private readonly usageBudget = new ProviderUsageBudget();
  private readonly cache = new Map<string, CachedBundle>();
  private readonly userRequests = new Map<string, number[]>();
  private lastSuccessfulUpdateAt: number | null = null;
  private lastConnectionState: MarketDataProviderStatusResponseConnectionState = "disconnected";

  constructor(options: MarketDataServiceOptions = {}) {
    this.env = options.env ?? process.env;
    this.clock = options.clock ?? Date.now;
    this.config = readMarketDataConfiguration(this.env);
    this.provider = options.provider !== undefined
      ? options.provider
      : createProviderFromConfiguration(this.config.configuration, options.fetcher);
  }

  getStatus(): MarketDataProviderStatusResponse {
    const now = this.clock();
    let state = this.lastConnectionState;
    if (
      this.lastSuccessfulUpdateAt == null ||
      now - this.lastSuccessfulUpdateAt > CONNECTION_FRESHNESS_MS
    ) state = "disconnected";
    if (this.config.configuration === null) state = "configuration_required";
    return statusResponse(
      this.config,
      this.lastSuccessfulUpdateAt,
      state,
    );
  }

  private checkUserLimit(userId: string, now: number): number | null {
    const recent = (this.userRequests.get(userId) ?? [])
      .filter((timestamp) => timestamp > now - USER_WINDOW_MS);
    if (
      recent.length >= USER_REQUEST_LIMIT ||
      (recent.length > 0 && now - recent[recent.length - 1] < USER_MIN_INTERVAL_MS)
    ) {
      const retry = recent.length >= USER_REQUEST_LIMIT
        ? Math.max(1, Math.ceil((recent[0] + USER_WINDOW_MS - now) / 1_000))
        : Math.max(1, Math.ceil((recent[recent.length - 1] + USER_MIN_INTERVAL_MS - now) / 1_000));
      return retry;
    }
    recent.push(now);
    this.userRequests.set(userId, recent);
    return null;
  }

  private async fetchBundle(
    provider: MarketDataProvider,
    providerSymbol: ProviderSymbol,
  ): Promise<{ quote: ProviderQuote | null; series: Partial<Record<TradingTimeframe, ProviderCandleSeries>>; failures: string[] }> {
    const tasks = [
      provider.fetchQuote(providerSymbol).then((quote) => ({ kind: "quote" as const, quote })),
      ...TIMEFRAMES.map((timeframe) =>
        provider.fetchCandles(providerSymbol, timeframe)
          .then((series) => ({ kind: "candles" as const, timeframe, series })),
      ),
    ];
    const results = await Promise.allSettled(tasks);
    let quote: ProviderQuote | null = null;
    const series: Partial<Record<TradingTimeframe, ProviderCandleSeries>> = {};
    const failures: string[] = [];
    for (const result of results) {
      if (result.status === "rejected") {
        const error = result.reason;
        const kind = error instanceof MarketDataProviderError ? error.kind : "unavailable";
        failures.push(kind);
        continue;
      }
      if (result.value.kind === "quote") quote = result.value.quote;
      else series[result.value.timeframe] = result.value.series;
    }
    return { quote, series, failures };
  }

  async analyze(
    requestedSymbol: string,
    userId: string,
  ): Promise<MarketDataAnalysisResponse> {
    const now = this.clock();
    if (!this.config.configuration || !this.provider) {
      throw new MarketDataServiceError(
        503,
        errorResponse(
          "PROVIDER_NOT_CONFIGURED",
          this.config.message,
        ),
        "provider_not_configured",
      );
    }

    const emptyTimeframes: TradingAnalysisInputTimeframes = {
      "1D": [],
      "4H": [],
      "1H": [],
      "30M": [],
    };
    const baseline = analyzeTrading({ symbol: requestedSymbol, timeframes: emptyTimeframes }, now);
    if (!baseline.canonicalSymbol || baseline.instrumentClass === "unsupported") {
      throw new MarketDataServiceError(
        400,
        errorResponse("SYMBOL_UNSUPPORTED", "Enter a supported gold, Bitcoin, forex, or index symbol."),
        "unsupported_symbol",
      );
    }

    let providerSymbol: ProviderSymbol;
    try {
      providerSymbol = resolveTwelveDataSymbol(
        baseline.canonicalSymbol,
        this.config.configuration.symbolMappings,
        requestedSymbol,
      );
    } catch (error) {
      throw asServiceError(error);
    }

    const retryAfter = this.checkUserLimit(userId, now);
    if (retryAfter != null) {
      throw new MarketDataServiceError(
        429,
        errorResponse(
          "REQUEST_RATE_LIMITED",
          "Market-data requests are limited. Wait before trying again.",
          retryAfter,
        ),
        "user_rate_limited",
      );
    }

    const cacheKey = `${baseline.canonicalSymbol}:${providerSymbol.symbol}:${providerSymbol.exchange ?? ""}`;
    let bundle = this.cache.get(cacheKey);
    if (bundle && now - bundle.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(cacheKey);
      bundle = undefined;
    }
    const cacheHit = bundle !== undefined;
    let failures: string[] = [];

    if (!bundle) {
      const retryBudget = this.usageBudget.reserve(
        now,
        ANALYSIS_CREDIT_COST,
        this.config.configuration,
      );
      if (retryBudget != null) {
        throw new MarketDataServiceError(
          429,
          errorResponse(
            "PROVIDER_RATE_LIMITED",
            "The local provider quota guard is limiting requests.",
            retryBudget,
          ),
          "local_provider_budget",
        );
      }
      const fetched = await this.fetchBundle(this.provider, providerSymbol);
      failures = fetched.failures;
      bundle = {
        cachedAt: now,
        quote: fetched.quote,
        series: fetched.series,
      };
      if (
        fetched.quote &&
        Object.keys(fetched.series).length === TIMEFRAMES.length &&
        failures.length === 0
      ) this.cache.set(cacheKey, bundle);
    }

    const quote = bundle?.quote ?? null;
    const series = bundle?.series ?? {};
    const timeframes: TradingAnalysisInputTimeframes = {};
    for (const timeframe of TIMEFRAMES) {
      const candles = series[timeframe]?.candles;
      if (candles) timeframes[timeframe] = candles;
    }
    let analysis = analyzeTrading({ symbol: requestedSymbol, timeframes }, now);

    const quoteAge = quote == null ? Number.POSITIVE_INFINITY : now - quote.timestamp;
    const maxQuoteAge = baseline.marketSchedule === "continuous_24_7"
      ? CRYPTO_QUOTE_MAX_AGE_MS
      : FRESH_QUOTE_MAX_AGE_MS;
    const sessionKnownOpen = baseline.marketSchedule === "continuous_24_7"
      ? quote?.marketOpen !== false
      : quote?.marketOpen === true;
    const quoteFresh = quote != null &&
      quoteAge >= 0 &&
      quoteAge <= maxQuoteAge &&
      sessionKnownOpen;
    const allTimeframesAvailable = TIMEFRAMES.every(
      (timeframe) => analysis.timeframes.find((item) => item.timeframe === timeframe)?.dataStatus === "available",
    );
    const anyProviderData = quote != null || Object.keys(series).length > 0;
    const freshness: MarketDataAnalysisResponse["freshness"] =
      !anyProviderData
        ? "unavailable"
        : quoteFresh && allTimeframesAvailable && analysis.marketFreshness === "fresh"
          ? "fresh"
          : "stale";
    const configuredMode = this.config.configuration.feedMode;
    const dataMode: MarketDataProviderStatusResponseDataMode =
      !anyProviderData
        ? "unavailable"
        : configuredMode;
    const canProduceCurrentSignal =
      configuredMode === "live" &&
      freshness === "fresh" &&
      analysis.signal.decision !== "NO_TRADE";

    analysis = {
      ...analysis,
      dataSource: dataMode === "live"
        ? "provider_live"
        : dataMode === "delayed"
          ? "provider_delayed"
          : "unavailable",
      analysisTimestamp: now,
      lastMarketTimestamp: quote?.timestamp ?? analysis.lastMarketTimestamp,
      marketFreshness: freshness,
      currentPrice: quoteFresh ? quote.price : null,
      signal: canProduceCurrentSignal
        ? analysis.signal
        : forceNoTrade(
          analysis.signal,
          freshness === "stale" ? "stale" : "unavailable",
          configuredMode === "delayed"
            ? "NO TRADE: this provider is configured for delayed data; no current live-market signal is generated."
            : freshness === "stale"
              ? "NO TRADE: the quote or one or more required timeframes are stale, closed-session, or incomplete."
              : "NO TRADE: current quotes and all four valid timeframes are required.",
        ),
    };

    const completeFetch = quote != null &&
      TIMEFRAMES.every((timeframe) => series[timeframe] != null);
    if (completeFetch) {
      if (!cacheHit) this.lastSuccessfulUpdateAt = now;
      this.lastConnectionState = freshness === "fresh" && configuredMode === "live"
        ? "connected"
        : "delayed";
    } else {
      this.lastConnectionState = "disconnected";
    }

    const warnings: string[] = failures.map((failure) =>
      failure === "rate_limited"
        ? "The provider rate limit was reached for one or more requests."
        : failure === "timeout"
          ? "One or more provider requests timed out."
          : "One or more quotes or timeframes could not be retrieved.",
    );
    if (!quote) warnings.push("The latest quote is unavailable; no live signal was generated.");
    if (!allTimeframesAvailable) warnings.push("All four sufficiently long, fresh timeframes are required for a signal.");
    if (configuredMode === "delayed") warnings.push("This feed is classified as delayed and cannot generate a live signal.");
    if (quote && !sessionKnownOpen) warnings.push("The provider does not confirm an open market session; live analysis is disabled.");

    const firstSeries = TIMEFRAMES
      .map((timeframe) => series[timeframe])
      .find((item): item is ProviderCandleSeries => item != null);
    const quoteResponse: MarketDataQuote | null = quote
      ? {
        symbol: quote.symbol,
        exchange: quote.exchange ?? firstSeries?.exchange ?? null,
        price: quote.price,
        timestamp: quote.timestamp,
        marketOpen: quote.marketOpen,
      }
      : null;

    return {
      providerId: "twelvedata",
      providerName: this.config.providerName,
      providerSymbol: providerSymbol.symbol,
      providerExchange: providerSymbol.exchange ?? quote?.exchange ?? firstSeries?.exchange ?? null,
      dataMode,
      freshness,
      quote: quoteResponse,
      lastSuccessfulUpdateAt: this.lastSuccessfulUpdateAt,
      warnings: [...new Set(warnings)],
      analysis,
    };
  }
}

export function createDefaultMarketDataService(
  options: MarketDataServiceOptions = {},
): MarketDataService {
  return new MarketDataService(options);
}
