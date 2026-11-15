// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { TradingTimeframe } from "@workspace/api-zod";
import {
  readMarketDataConfiguration,
  resolveTwelveDataSymbol,
} from "../src/lib/market-data/config";
import {
  MarketDataService,
  MarketDataServiceError,
} from "../src/lib/market-data/service";
import { TwelveDataProvider } from "../src/lib/market-data/twelve-data";
import {
  MarketDataProviderError,
  type MarketDataProvider,
  type ProviderCandleSeries,
  type ProviderQuote,
  type ProviderSymbol,
} from "../src/lib/market-data/types";

const FIXED_NOW = Date.UTC(2026, 10, 15, 12, 0, 0);
const FRAME_MS: Record<TradingTimeframe, number> = {
  "30M": 30 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
};

function makeSeries(timeframe: TradingTimeframe, now = FIXED_NOW): ProviderCandleSeries {
  const step = FRAME_MS[timeframe];
  return {
    symbol: "XAU/USD",
    exchange: "Test Exchange",
    exchangeTimezone: "UTC",
    candles: Array.from({ length: 60 }, (_, index) => {
      const close = 2_000 + index;
      const timeframeOrigin = timeframe === "1D"
        ? Math.floor(now / FRAME_MS["1D"]) * FRAME_MS["1D"]
        : now;
      return {
        timestamp: timeframeOrigin - (60 - index + 1) * step,
        open: close - 0.5,
        high: close + 1,
        low: close - 1,
        close,
        volume: 100,
      };
    }),
  };
}

function makeProvider(options: {
  now?: () => number;
  quoteTimestamp?: number;
  marketOpen?: boolean | null;
  failQuote?: boolean;
  failTimeframe?: TradingTimeframe;
} = {}): MarketDataProvider {
  const now = options.now?.() ?? FIXED_NOW;
  return {
    id: "twelvedata",
    name: "Twelve Data",
    fetchQuote: vi.fn(async (instrument: ProviderSymbol): Promise<ProviderQuote> => {
      if (options.failQuote) throw new MarketDataProviderError("timeout", "timed out");
      return {
        symbol: instrument.symbol,
        exchange: instrument.exchange ?? "Test Exchange",
        price: 2_059.5,
        timestamp: options.quoteTimestamp ?? now - 30_000,
        marketOpen: options.marketOpen === undefined ? true : options.marketOpen,
      };
    }),
    fetchCandles: vi.fn(async (
      instrument: ProviderSymbol,
      timeframe: TradingTimeframe,
    ): Promise<ProviderCandleSeries> => {
      if (options.failTimeframe === timeframe) {
        throw new MarketDataProviderError("unavailable", "unavailable");
      }
      return {
        ...makeSeries(timeframe, now),
        symbol: instrument.symbol,
        exchange: instrument.exchange ?? "Test Exchange",
      };
    }),
  };
}

function configuredEnvironment(mode = "live"): Record<string, string> {
  return {
    MARKET_DATA_PROVIDER: "twelvedata",
    TWELVE_DATA_API_KEY: "unit-test-placeholder-not-a-credential",
    MARKET_DATA_EXTERNAL_DISPLAY_LICENSED: "true",
    MARKET_DATA_FEED_MODE: mode,
  };
}

function createResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("market-data configuration and symbol safety", () => {
  it("fails closed when provider credentials or display approval are missing", () => {
    const status = readMarketDataConfiguration({
      MARKET_DATA_PROVIDER: "twelvedata",
      MARKET_DATA_FEED_MODE: "live",
    });
    expect(status.connectionState).toBe("configuration_required");
    expect(status.dataMode).toBe("unavailable");
    expect(status.message).not.toContain("unit-test");
  });

  it("resolves verified gold, Bitcoin, and forex symbols", () => {
    expect(resolveTwelveDataSymbol("XAUUSD").symbol).toBe("XAU/USD");
    expect(resolveTwelveDataSymbol("BTCUSD").symbol).toBe("BTC/USD");
    expect(resolveTwelveDataSymbol("EURUSD").symbol).toBe("EUR/USD");
    expect(() => resolveTwelveDataSymbol("BTCUSDT")).toThrow(MarketDataProviderError);
    expect(resolveTwelveDataSymbol("BTCUSDT", {
      BTCUSDT: { symbol: "BTC/USDT", exchange: "Verified Exchange" },
    })).toEqual({ symbol: "BTC/USDT", exchange: "Verified Exchange" });
  });

  it("requires an exact configured mapping for broker indices", () => {
    expect(() => resolveTwelveDataSymbol("US30")).toThrow(MarketDataProviderError);
    expect(resolveTwelveDataSymbol("US30", {
      US30: { symbol: "DJI", exchange: "Verified Exchange" },
    })).toEqual({ symbol: "DJI", exchange: "Verified Exchange" });
  });

  it("does not silently map broker-specific suffixes to a generic provider pair", () => {
    expect(() => resolveTwelveDataSymbol("XAUUSD", {}, "XAUUSDm")).toThrow(
      MarketDataProviderError,
    );
    expect(resolveTwelveDataSymbol("XAUUSD", {
      XAUUSDM: { symbol: "XAU/USD", exchange: "Verified Feed" },
    }, "XAUUSDm")).toEqual({
      symbol: "XAU/USD",
      exchange: "Verified Feed",
    });
  });

  it("rejects invalid provider mapping configuration without echoing it", () => {
    const result = readMarketDataConfiguration({
      ...configuredEnvironment(),
      MARKET_DATA_SYMBOL_MAP_JSON: '{"US30":{"symbol":"bad symbol"}}',
    });
    expect(result.connectionState).toBe("configuration_required");
    expect(result.message).not.toContain("bad symbol");
  });
});

describe("Twelve Data adapter", () => {
  it("requests supported timeframe intervals and normalizes exchange-local daily timestamps", async () => {
    const requests: URL[] = [];
    const fetcher: typeof fetch = vi.fn(async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      if (url.pathname.endsWith("/quote")) {
        return createResponse({
          symbol: "EUR/USD",
          exchange: "Test Exchange",
          close: "1.1234",
          timestamp: Math.floor(FIXED_NOW / 1_000),
          last_quote_at: Math.floor(FIXED_NOW / 1_000),
          is_market_open: true,
        });
      }
      const interval = url.searchParams.get("interval");
      return createResponse({
        meta: {
          symbol: "EUR/USD",
          exchange: "Test Exchange",
          exchange_timezone: "America/New_York",
        },
        values: [{
          datetime: interval === "1day" ? "2026-01-02" : "2026-01-02 07:00:00",
          open: "1.1",
          high: "1.2",
          low: "1.0",
          close: "1.15",
          volume: "12",
        }],
      });
    });
    const provider = new TwelveDataProvider(
      "unit-test-placeholder-not-a-credential",
      fetcher,
      500,
      "https://provider.invalid",
    );
    const quote = await provider.fetchQuote({ symbol: "EUR/USD" });
    const daily = await provider.fetchCandles({ symbol: "EUR/USD" }, "1D");
    await provider.fetchCandles({ symbol: "EUR/USD" }, "4H");
    await provider.fetchCandles({ symbol: "EUR/USD" }, "1H");
    await provider.fetchCandles({ symbol: "EUR/USD" }, "30M");

    expect(quote.price).toBe(1.1234);
    expect(quote.marketOpen).toBe(true);
    expect(daily.candles[0].timestamp).toBe(Date.UTC(2026, 0, 2, 5));
    expect(requests[0].searchParams.get("interval")).toBe("1min");
    expect(requests[1].searchParams.get("interval")).toBe("1day");
    expect(requests.slice(2).map((url) => url.searchParams.get("interval"))).toEqual([
      "4h", "1h", "30min",
    ]);
    expect(requests[1].searchParams.has("timezone")).toBe(false);
    expect(requests.slice(2).every((url) => url.searchParams.get("timezone") === "UTC")).toBe(true);
    expect(requests.slice(1).every((url) => url.searchParams.get("outputsize") === "200")).toBe(true);
  });

  it("interprets intraday datetimes as UTC even when exchange metadata is non-UTC", async () => {
    let requestedUrl: URL | undefined;
    const provider = new TwelveDataProvider(
      "unit-test-placeholder",
      vi.fn(async (input) => {
        requestedUrl = new URL(String(input));
        return createResponse({
          meta: {
            symbol: "EUR/USD",
            exchange: "Test Exchange",
            exchange_timezone: "America/New_York",
          },
          values: [{
            datetime: "2026-03-08 07:00:00",
            open: "1.1",
            high: "1.2",
            low: "1.0",
            close: "1.15",
          }],
        });
      }),
      500,
      "https://provider.invalid",
    );

    const series = await provider.fetchCandles({ symbol: "EUR/USD" }, "30M");
    expect(series.candles[0].timestamp).toBe(Date.parse("2026-03-08T07:00:00Z"));
    expect(requestedUrl?.searchParams.get("timezone")).toBe("UTC");
  });

  it.each([
    ["2026-03-08", "2026-03-08T05:00:00Z"],
    ["2026-03-09", "2026-03-09T04:00:00Z"],
    ["2026-11-01", "2026-11-01T04:00:00Z"],
    ["2026-11-02", "2026-11-02T05:00:00Z"],
  ])("interprets daily date %s as exchange-local midnight across DST", async (datetime, expected) => {
    const provider = new TwelveDataProvider(
      "unit-test-placeholder",
      vi.fn(async () => createResponse({
        meta: {
          symbol: "EUR/USD",
          exchange: "Test Exchange",
          exchange_timezone: "America/New_York",
        },
        values: [{
          datetime,
          open: "1.1",
          high: "1.2",
          low: "1.0",
          close: "1.15",
        }],
      })),
      500,
      "https://provider.invalid",
    );

    const series = await provider.fetchCandles({ symbol: "EUR/USD" }, "1D");
    expect(series.candles[0].timestamp).toBe(Date.parse(expected));
  });

  it.each([
    ["2026-02-30 07:00:00", "30M", "America/New_York"],
    ["2026-03-08T07:00:00Z", "1H", "America/New_York"],
    ["2026-02-30", "1D", "America/New_York"],
    ["2026-03-08", "1D", null],
  ] as const)("rejects undocumented or invalid provider timestamp %s for %s", async (datetime, timeframe, timezone) => {
    const provider = new TwelveDataProvider(
      "unit-test-placeholder",
      vi.fn(async () => createResponse({
        meta: {
          symbol: "EUR/USD",
          exchange: "Test Exchange",
          ...(timezone ? { exchange_timezone: timezone } : {}),
        },
        values: [{
          datetime,
          open: "1.1",
          high: "1.2",
          low: "1.0",
          close: "1.15",
        }],
      })),
      500,
      "https://provider.invalid",
    );

    await expect(
      provider.fetchCandles({ symbol: "EUR/USD" }, timeframe),
    ).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("rejects malformed candles and mismatched provider symbols", async () => {
    const invalidCandleFetch: typeof fetch = vi.fn(async () => createResponse({
      meta: { symbol: "XAU/USD", exchange_timezone: "UTC" },
      values: [{ datetime: "2026-01-02 12:00:00", open: "2", high: "1", low: "1", close: "2" }],
    }));
    const invalidProvider = new TwelveDataProvider(
      "unit-test-placeholder",
      invalidCandleFetch,
      500,
      "https://provider.invalid",
    );
    await expect(
      invalidProvider.fetchCandles({ symbol: "XAU/USD" }, "1H"),
    ).rejects.toMatchObject({ kind: "invalid_response" });

    const mismatchedFetch: typeof fetch = vi.fn(async () => createResponse({
      symbol: "BTC/USD",
      close: "1",
      timestamp: Math.floor(FIXED_NOW / 1_000),
    }));
    const mismatchedProvider = new TwelveDataProvider(
      "unit-test-placeholder",
      mismatchedFetch,
      500,
      "https://provider.invalid",
    );
    await expect(
      mismatchedProvider.fetchQuote({ symbol: "XAU/USD" }),
    ).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("sanitizes network errors and stops timed-out provider requests", async () => {
    const leakingFetcher: typeof fetch = vi.fn(async () => {
      throw new Error("https://provider.invalid/?apikey=unit-test-secret");
    });
    const provider = new TwelveDataProvider(
      "unit-test-secret",
      leakingFetcher,
      500,
      "https://provider.invalid",
    );
    const networkError = await provider.fetchQuote({ symbol: "BTC/USD" }).catch((error: unknown) => error);
    expect(networkError).toBeInstanceOf(MarketDataProviderError);
    expect((networkError as Error).message).not.toContain("unit-test-secret");

    const timeoutFetcher: typeof fetch = vi.fn((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    );
    const timeoutProvider = new TwelveDataProvider(
      "unit-test-placeholder",
      timeoutFetcher,
      1,
      "https://provider.invalid",
    );
    await expect(
      timeoutProvider.fetchQuote({ symbol: "BTC/USD" }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });
});

describe("provider-backed analysis service", () => {
  it("rejects stale quotes and never returns a live signal", async () => {
    const provider = makeProvider({ quoteTimestamp: FIXED_NOW - 10 * 60_000 });
    const service = new MarketDataService({
      env: configuredEnvironment(),
      clock: () => FIXED_NOW,
      provider,
    });
    const response = await service.analyze("XAUUSD", "member-a");
    expect(response.freshness).toBe("stale");
    expect(response.analysis.currentPrice).toBeNull();
    expect(response.analysis.signal.decision).toBe("NO_TRADE");
    expect(response.analysis.dataSource).toBe("provider_live");
  });

  it("marks stale provider candles stale after timezone normalization", async () => {
    const baseProvider = makeProvider();
    const provider: MarketDataProvider = {
      ...baseProvider,
      fetchCandles: vi.fn(async (instrument, timeframe) => {
        const series = await baseProvider.fetchCandles(instrument, timeframe);
        return timeframe === "30M"
          ? {
            ...series,
            candles: series.candles.map((candle) => ({
              ...candle,
              timestamp: candle.timestamp - 60 * 60_000,
            })),
          }
          : series;
      }),
    };
    const service = new MarketDataService({
      env: configuredEnvironment(),
      clock: () => FIXED_NOW,
      provider,
    });

    const response = await service.analyze("XAUUSD", "member-a");
    expect(response.freshness).toBe("stale");
    expect(response.analysis.marketFreshness).toBe("stale");
    expect(response.analysis.signal.decision).toBe("NO_TRADE");
  });

  it("labels delayed data and suppresses current live signals", async () => {
    const service = new MarketDataService({
      env: configuredEnvironment("delayed"),
      clock: () => FIXED_NOW,
      provider: makeProvider(),
    });
    const response = await service.analyze("BTCUSD", "member-a");
    expect(response.dataMode).toBe("delayed");
    expect(response.analysis.dataSource).toBe("provider_delayed");
    expect(response.analysis.signal.decision).toBe("NO_TRADE");
    expect(response.warnings).toContain(
      "This feed is classified as delayed and cannot generate a live signal.",
    );
  });

  it("uses the 24/7 Bitcoin schedule and handles forex only when the provider confirms an open session", async () => {
    const bitcoinService = new MarketDataService({
      env: configuredEnvironment(),
      clock: () => FIXED_NOW,
      provider: makeProvider({ marketOpen: null }),
    });
    const bitcoin = await bitcoinService.analyze("BTCUSD", "bitcoin-user");
    expect(bitcoin.analysis.marketSchedule).toBe("continuous_24_7");
    expect(bitcoin.freshness).toBe("fresh");

    const forexService = new MarketDataService({
      env: configuredEnvironment(),
      clock: () => FIXED_NOW,
      provider: makeProvider({ marketOpen: true }),
    });
    const forex = await forexService.analyze("EURUSD", "forex-user");
    expect(forex.analysis.instrumentClass).toBe("forex");
    expect(forex.analysis.marketSchedule).toBe("fx_weekdays");
    expect(forex.freshness).toBe("fresh");
  });

  it("rejects closed or unconfirmed non-crypto sessions without assuming continuous trading", async () => {
    const provider = makeProvider({ marketOpen: false });
    const service = new MarketDataService({
      env: {
        ...configuredEnvironment(),
        MARKET_DATA_SYMBOL_MAP_JSON: JSON.stringify({
          US30: { symbol: "verified-index", exchange: "Test Exchange" },
        }),
      },
      clock: () => FIXED_NOW,
      provider,
    });
    const response = await service.analyze("US30", "member-a");
    expect(response.freshness).toBe("stale");
    expect(response.analysis.signal.decision).toBe("NO_TRADE");
    expect(response.warnings).toContain(
      "The provider does not confirm an open market session; live analysis is disabled.",
    );
  });

  it("returns no-trade analysis for partial provider failures", async () => {
    const service = new MarketDataService({
      env: configuredEnvironment(),
      clock: () => FIXED_NOW,
      provider: makeProvider({ failTimeframe: "4H" }),
    });
    const response = await service.analyze("XAUUSD", "member-a");
    expect(response.freshness).toBe("stale");
    expect(response.analysis.signal.decision).toBe("NO_TRADE");
    expect(response.warnings.some((warning) => /could not be retrieved/.test(warning))).toBe(true);
  });

  it("uses short-lived successful cache without serving expired entries as live", async () => {
    let now = FIXED_NOW;
    const provider = makeProvider({ now: () => now });
    const service = new MarketDataService({
      env: {
        ...configuredEnvironment(),
        MARKET_DATA_CREDITS_PER_MINUTE: "20",
      },
      clock: () => now,
      provider,
    });
    const first = await service.analyze("BTCUSD", "member-a");
    now += 12_000;
    const cached = await service.analyze("BTCUSD", "member-b");
    expect(cached.lastSuccessfulUpdateAt).toBe(first.lastSuccessfulUpdateAt);
    expect(provider.fetchQuote).toHaveBeenCalledTimes(1);

    now += 4_000;
    const refreshed = await service.analyze("BTCUSD", "member-c");
    expect(refreshed.lastSuccessfulUpdateAt).toBe(now);
    expect(provider.fetchQuote).toHaveBeenCalledTimes(2);
  });

  it("guards the provider quota even when requests use different symbols", async () => {
    let now = FIXED_NOW;
    const provider = makeProvider({ now: () => now });
    const service = new MarketDataService({
      env: configuredEnvironment(),
      clock: () => now,
      provider,
    });
    await service.analyze("XAUUSD", "member-a");
    now += 11_000;
    await expect(service.analyze("BTCUSD", "member-a")).rejects.toMatchObject({
      statusCode: 429,
      response: { code: "PROVIDER_RATE_LIMITED" },
    });
  });

  it("reports provider readiness without exposing configured credentials", () => {
    const service = new MarketDataService({
      env: {},
      clock: () => FIXED_NOW,
    });
    const status = service.getStatus();
    expect(status.connectionState).toBe("configuration_required");
    expect(status.dataMode).toBe("unavailable");
    expect(status.message).not.toContain("API key");
  });
});
