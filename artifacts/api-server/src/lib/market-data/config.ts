import type {
  MarketDataProviderStatusResponse,
  MarketDataProviderStatusResponseConnectionState,
  MarketDataProviderStatusResponseDataMode,
  MarketDataProviderStatusResponseProviderId,
} from "@workspace/api-zod";
import {
  MarketDataProviderError,
  type ProviderSymbol,
} from "./types";
import { TwelveDataProvider } from "./twelve-data";

export type MarketDataFeedMode = "live" | "delayed";

export interface TwelveDataConfiguration {
  apiKey: string;
  feedMode: MarketDataFeedMode;
  externalDisplayLicensed: true;
  symbolMappings: Record<string, ProviderSymbol>;
  creditsPerMinute: number;
  creditsPerDay: number;
}

export interface MarketDataRuntimeConfiguration {
  providerId: MarketDataProviderStatusResponseProviderId;
  providerName: string;
  connectionState: MarketDataProviderStatusResponseConnectionState;
  dataMode: MarketDataProviderStatusResponseDataMode;
  configuration: TwelveDataConfiguration | null;
  message: string;
}

const DEFAULT_SYMBOL_MAPPINGS: Record<string, ProviderSymbol> = {
  XAUUSD: { symbol: "XAU/USD" },
  BTCUSD: { symbol: "BTC/USD" },
};

const FX_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF",
  "NOK", "SEK", "SGD", "HKD", "MXN", "ZAR", "TRY", "PLN",
  "CNH", "CNY",
]);

function boundedInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
}

function validProviderSymbol(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    /^[A-Za-z0-9][A-Za-z0-9./_-]*$/.test(value);
}

function validProviderExchange(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    /^[A-Za-z0-9][A-Za-z0-9 .&/_-]*$/.test(value);
}

function parseSymbolMappings(
  value: string | undefined,
): Record<string, ProviderSymbol> | null {
  if (!value?.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const mappings: Record<string, ProviderSymbol> = {};
  for (const [rawKey, rawMapping] of Object.entries(parsed)) {
    const key = rawKey.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!key || key.length > 32) return null;
    const mapping = typeof rawMapping === "string"
      ? { symbol: rawMapping }
      : rawMapping;
    if (
      typeof mapping !== "object" ||
      mapping === null ||
      Array.isArray(mapping) ||
      !validProviderSymbol((mapping as Record<string, unknown>).symbol)
    ) return null;
    const exchange = (mapping as Record<string, unknown>).exchange;
    if (exchange !== undefined && !validProviderExchange(exchange)) return null;
    mappings[key] = {
      symbol: (mapping as Record<string, string>).symbol,
      ...(typeof exchange === "string" ? { exchange } : {}),
    };
  }
  return mappings;
}

export function resolveTwelveDataSymbol(
  canonicalSymbol: string,
  mappings: Record<string, ProviderSymbol> = {},
  requestedSymbol = canonicalSymbol,
): ProviderSymbol {
  const canonical = canonicalSymbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const requested = requestedSymbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const explicitAlias = mappings[requested];
  if (explicitAlias) return explicitAlias;
  const explicit = mappings[canonical];
  if (explicit) return explicit;
  if (requested !== canonical) {
    throw new MarketDataProviderError(
      "unsupported_symbol",
      "This broker alias needs an explicit provider symbol mapping.",
    );
  }
  const defaultMapping = DEFAULT_SYMBOL_MAPPINGS[canonical];
  if (defaultMapping) return defaultMapping;
  if (canonical.length === 6) {
    const base = canonical.slice(0, 3);
    const quote = canonical.slice(3);
    if (FX_CURRENCIES.has(base) && FX_CURRENCIES.has(quote) && base !== quote) {
      return { symbol: `${base}/${quote}` };
    }
  }
  throw new MarketDataProviderError(
    "unsupported_symbol",
    "This instrument has no verified provider symbol mapping.",
  );
}

export function readMarketDataConfiguration(
  env: Record<string, string | undefined> = process.env,
): MarketDataRuntimeConfiguration {
  const requestedProvider = env.MARKET_DATA_PROVIDER?.trim().toLowerCase();
  if (!requestedProvider || requestedProvider === "none") {
    return {
      providerId: "none",
      providerName: "No provider selected",
      connectionState: "configuration_required",
      dataMode: "unavailable",
      configuration: null,
      message: "Select a server-side provider to enable market data. CSV imports remain available.",
    };
  }
  if (requestedProvider !== "twelvedata") {
    return {
      providerId: "none",
      providerName: "Unsupported provider",
      connectionState: "configuration_required",
      dataMode: "unavailable",
      configuration: null,
      message: "The selected provider is not installed. CSV imports remain available.",
    };
  }

  const apiKey = env.TWELVE_DATA_API_KEY?.trim();
  const feedMode = env.MARKET_DATA_FEED_MODE;
  const hasLicenseConfirmation =
    env.MARKET_DATA_EXTERNAL_DISPLAY_LICENSED?.trim().toLowerCase() === "true";
  const symbolMappings = parseSymbolMappings(env.MARKET_DATA_SYMBOL_MAP_JSON);
  const missing: string[] = [];
  if (!apiKey) missing.push("server-side API credentials");
  if (!hasLicenseConfirmation) missing.push("external-display data-use approval");
  if (feedMode !== "live" && feedMode !== "delayed") {
    missing.push("a live or delayed feed classification");
  }
  if (symbolMappings === null) missing.push("a valid provider symbol map");

  if (missing.length > 0) {
    return {
      providerId: "twelvedata",
      providerName: "Twelve Data",
      connectionState: "configuration_required",
      dataMode: "unavailable",
      configuration: null,
      message: `Market data is not enabled: configure ${missing.join(", ")}. CSV imports remain available.`,
    };
  }

  return {
    providerId: "twelvedata",
    providerName: "Twelve Data",
    connectionState: "disconnected",
    dataMode: feedMode as MarketDataFeedMode,
    configuration: {
      apiKey: apiKey!,
      feedMode: feedMode as MarketDataFeedMode,
      externalDisplayLicensed: true,
      symbolMappings: { ...symbolMappings! },
      // Conservative defaults match the provider's free evaluation quota.
      // Raise only when the account's actual plan and entitlements permit it.
      creditsPerMinute: boundedInteger(
        env.MARKET_DATA_CREDITS_PER_MINUTE,
        8,
        100_000,
      ),
      creditsPerDay: boundedInteger(
        env.MARKET_DATA_CREDITS_PER_DAY,
        800,
        10_000_000,
      ),
    },
    message: "Provider credentials and display approval are configured; fetch data to verify connectivity.",
  };
}

export function createProviderFromConfiguration(
  configuration: TwelveDataConfiguration | null,
  fetcher: typeof fetch = fetch,
) {
  return configuration
    ? new TwelveDataProvider(configuration.apiKey, fetcher)
    : null;
}

export function statusResponse(
  config: MarketDataRuntimeConfiguration,
  lastSuccessfulUpdateAt: number | null,
  lastConnectionState?: MarketDataProviderStatusResponseConnectionState,
): MarketDataProviderStatusResponse {
  const isConfigured = config.configuration !== null;
  const state = isConfigured
    ? lastConnectionState ?? "disconnected"
    : config.connectionState;
  const mode = config.configuration?.feedMode ?? config.dataMode;
  const message = state === "connected"
    ? "Provider returned fresh data; source timestamps are shown with each analysis."
    : state === "delayed"
      ? "Provider data is delayed, closed-session, or stale. It will not generate a live signal."
      : state === "disconnected"
        ? config.message
        : config.message;
  return {
    providerId: config.providerId,
    providerName: config.providerName,
    connectionState: state,
    dataMode: isConfigured ? mode : "unavailable",
    lastSuccessfulUpdateAt,
    supportedInstrumentClasses: ["gold", "bitcoin", "forex", "index"],
    message,
  };
}
