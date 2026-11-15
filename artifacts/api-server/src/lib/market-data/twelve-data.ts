import type { TradingCandle, TradingTimeframe } from "@workspace/api-zod";
import {
  MarketDataProviderError,
  type MarketDataProvider,
  type ProviderCandleSeries,
  type ProviderQuote,
  type ProviderSymbol,
} from "./types";

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

function parseLocalDateTime(value: string, timeZone: string): number | null {
  const explicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  if (explicitZone) {
    const timestamp = Date.parse(value.replace(" ", "T"));
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/,
  );
  if (!match) return null;
  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const parts = [Number(year), Number(month), Number(day), Number(hour), Number(minute), Number(second)];
  if (
    parts.some((part) => !Number.isInteger(part)) ||
    parts[1] < 1 || parts[1] > 12 || parts[2] < 1 || parts[2] > 31 ||
    parts[3] > 23 || parts[4] > 59 || parts[5] > 59
  ) return null;

  const [y, m, d, h, min, s] = parts;
  const utcGuess = Date.UTC(y, m - 1, d, h, min, s);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    let candidate = utcGuess;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const formatted = Object.fromEntries(
        formatter.formatToParts(new Date(candidate)).map(({ type, value: part }) => [type, part]),
      );
      const representedAsUtc = Date.UTC(
        Number(formatted.year),
        Number(formatted.month) - 1,
        Number(formatted.day),
        Number(formatted.hour),
        Number(formatted.minute),
        Number(formatted.second),
      );
      candidate = utcGuess - (representedAsUtc - candidate);
    }
    return Number.isSafeInteger(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function parseProviderTimestamp(value: unknown, timeZone: string): number | null {
  if (typeof value !== "string") return null;
  const timestamp = parseLocalDateTime(value.trim(), timeZone);
  return timestamp != null && Number.isSafeInteger(timestamp) && timestamp > 0
    ? timestamp
    : null;
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
    const response = await this.request("time_series", instrument, {
      interval: TIMEFRAME_INTERVAL[timeframe],
      outputsize: String(MAX_CANDLES),
      timezone: "UTC",
    });
    const meta = isObject(response.meta) ? response.meta : null;
    const values = response.values;
    const timezone = stringValue(meta?.exchange_timezone) ?? "UTC";
    if (!meta || !Array.isArray(values) || values.length > MAX_CANDLES) {
      throw new MarketDataProviderError(
        "invalid_response",
        "The market-data provider candle response is incomplete.",
      );
    }
    validateProviderSymbol(meta, instrument);

    const candles: TradingCandle[] = [];
    for (const value of values) {
      if (!isObject(value)) {
        throw new MarketDataProviderError(
          "invalid_response",
          "The market-data provider returned a malformed candle.",
        );
      }
      const timestamp = parseProviderTimestamp(value.datetime, timezone);
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
      exchangeTimezone: timezone,
      candles,
    };
  }
}
