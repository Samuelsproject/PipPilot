import type { TradingCandle, TradingTimeframe } from "@workspace/api-zod";
import {
  MarketDataProviderError,
  type MarketDataProvider,
  type ProviderCandleSeries,
  type ProviderQuote,
  type ProviderSymbol,
} from "./types";
import { wallClockToTimestamp, type WallClockParts } from "../timezone";

const BASE_URL = "https://api.twelvedata.com";
const TIMEFRAME_INTERVAL: Record<TradingTimeframe, string> = {
  "30M": "30min",
  "1H": "1h",
  "4H": "4h",
  "1D": "1day",
};
const MAX_CANDLES = 200;

type JsonObject = Record<string, unknown>;
type Fetcher = typeof fetch;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numericValue(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function epochMilliseconds(value: unknown): number | null {
  const number = numericValue(value);
  if (number == null || number <= 0) return null;
  const milliseconds = number < 100_000_000_000 ? number * 1_000 : number;
  return Number.isSafeInteger(milliseconds) ? milliseconds : null;
}

function parseProviderTimestamp(
  value: unknown,
  timeframe: TradingTimeframe,
  exchangeTimezone: string | null,
): number | null {
  if (typeof value !== "string") return null;
  const datetime = value.trim();

  if (timeframe === "1D") {
    // Twelve Data documents daily bars as exchange-local dates; timezone= is
    // ignored for intervals of one day or longer.
    const match = datetime.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match || !exchangeTimezone) return null;
    const [, year, month, day] = match;
    const parts: WallClockParts = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: 0,
      minute: 0,
      second: 0,
    };
    const timestamp = wallClockToTimestamp(parts, exchangeTimezone);
    return timestamp != null && timestamp > 0 ? timestamp : null;
  }

  // The request explicitly sets timezone=UTC for intraday intervals. Twelve
  // Data returns "YYYY-MM-DD HH:mm:ss" without a zone suffix for that setting.
  const match = datetime.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const timestamp = wallClockToTimestamp({
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  }, "UTC");
  return timestamp != null && timestamp > 0 ? timestamp : null;
}

function tickerKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validateProviderSymbol(payload: JsonObject, requested: ProviderSymbol): void {
  const returned = stringValue(payload.symbol);
  if (!returned || tickerKey(returned) !== tickerKey(requested.symbol)) {
    throw new MarketDataProviderError(
      "invalid_response",
      "The provider returned a different instrument than requested.",
    );
  }
}

function safeRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds > 0 && seconds <= 3_600
    ? seconds
    : null;
}

export class TwelveDataProvider implements MarketDataProvider {
  readonly id = "twelvedata" as const;
  readonly name = "Twelve Data" as const;

  constructor(
    private readonly apiKey: string,
    private readonly fetcher: Fetcher = fetch,
    private readonly timeoutMs = 8_000,
    private readonly baseUrl = BASE_URL,
  ) {}

  private async request(
    endpoint: "quote" | "time_series",
    instrument: ProviderSymbol,
    extraParams: Record<string, string> = {},
  ): Promise<JsonObject> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("symbol", instrument.symbol);
    if (instrument.exchange) url.searchParams.set("exchange", instrument.exchange);
    for (const [name, value] of Object.entries(extraParams)) {
      url.searchParams.set(name, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (response.status === 429) {
        throw new MarketDataProviderError(
          "rate_limited",
          "The market-data provider rate limit was reached.",
          safeRetryAfter(response.headers.get("retry-after")),
        );
      }
      if (!response.ok) {
        throw new MarketDataProviderError(
          "unavailable",
          "The market-data provider request failed.",
        );
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new MarketDataProviderError(
          "invalid_response",
          "The market-data provider returned invalid JSON.",
        );
      }
      if (!isObject(payload)) {
        throw new MarketDataProviderError(
          "invalid_response",
          "The market-data provider returned an invalid response.",
        );
      }
      if (payload.status === "error") {
        throw new MarketDataProviderError(
          "unavailable",
          "The market-data provider could not return the requested data.",
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof MarketDataProviderError) throw error;
      if (controller.signal.aborted) {
        throw new MarketDataProviderError(
          "timeout",
          "The market-data provider request timed out.",
        );
      }
      throw new MarketDataProviderError(
        "unavailable",
        "The market-data provider is unavailable.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchQuote(instrument: ProviderSymbol): Promise<ProviderQuote> {
    const response = await this.request("quote", instrument, {
      interval: "1min",
      timezone: "UTC",
    });
    validateProviderSymbol(response, instrument);
    const price = numericValue(response.close);
    const timestamp = epochMilliseconds(response.last_quote_at ?? response.timestamp);
    const marketOpen = typeof response.is_market_open === "boolean"
      ? response.is_market_open
      : null;
    if (price == null || price <= 0 || timestamp == null) {
      throw new MarketDataProviderError(
        "invalid_response",
        "The market-data provider quote is missing a valid price or timestamp.",
      );
    }
    return {
      symbol: stringValue(response.symbol) ?? instrument.symbol,
      exchange: stringValue(response.exchange),
      price,
      timestamp,
      marketOpen,
    };
  }

  async fetchCandles(
    instrument: ProviderSymbol,
    timeframe: TradingTimeframe,
  ): Promise<ProviderCandleSeries> {
    const parameters: Record<string, string> = {
      interval: TIMEFRAME_INTERVAL[timeframe],
      outputsize: String(MAX_CANDLES),
    };
    if (timeframe !== "1D") parameters.timezone = "UTC";
    const response = await this.request("time_series", instrument, parameters);
    const meta = isObject(response.meta) ? response.meta : null;
    const values = response.values;
    if (!meta || !Array.isArray(values) || values.length > MAX_CANDLES) {
      throw new MarketDataProviderError(
        "invalid_response",
        "The market-data provider candle response is incomplete.",
      );
    }
    validateProviderSymbol(meta, instrument);
    const exchangeTimezone = stringValue(meta.exchange_timezone);
    if (timeframe === "1D" && !exchangeTimezone) {
      throw new MarketDataProviderError(
        "invalid_response",
        "The daily candle response is missing its exchange timezone.",
      );
    }

    const candles: TradingCandle[] = [];
    for (const value of values) {
      if (!isObject(value)) {
        throw new MarketDataProviderError(
          "invalid_response",
          "The market-data provider returned a malformed candle.",
        );
      }
      const timestamp = parseProviderTimestamp(value.datetime, timeframe, exchangeTimezone);
      const open = numericValue(value.open);
      const high = numericValue(value.high);
      const low = numericValue(value.low);
      const close = numericValue(value.close);
      const volume = numericValue(value.volume);
      if (
        timestamp == null ||
        open == null || high == null || low == null || close == null ||
        Math.min(open, high, low, close) <= 0 ||
        high < Math.max(open, close, low) ||
        low > Math.min(open, close, high) ||
        (volume != null && volume < 0)
      ) {
        throw new MarketDataProviderError(
          "invalid_response",
          "The market-data provider returned invalid OHLC data.",
        );
      }
      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        ...(volume == null ? {} : { volume }),
      });
    }

    candles.sort((left, right) => left.timestamp - right.timestamp);
    for (let index = 1; index < candles.length; index += 1) {
      if (candles[index].timestamp <= candles[index - 1].timestamp) {
        throw new MarketDataProviderError(
          "invalid_response",
          "The market-data provider returned duplicate candle timestamps.",
        );
      }
    }

    return {
      symbol: stringValue(meta.symbol) ?? instrument.symbol,
      exchange: stringValue(meta.exchange),
      exchangeTimezone: exchangeTimezone ?? "UTC",
      candles,
    };
  }
}
