import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mutateMock,
  providerMutateMock,
  useAnalyzeTradingMock,
  useAnalyzeMarketDataMock,
  useGetMarketDataStatusMock,
  useAuthMock,
  refetchStatusMock,
} = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  providerMutateMock: vi.fn(),
  useAnalyzeTradingMock: vi.fn(),
  useAnalyzeMarketDataMock: vi.fn(),
  useGetMarketDataStatusMock: vi.fn(),
  useAuthMock: vi.fn(),
  refetchStatusMock: vi.fn(),
}));

vi.mock("@workspace/api-client-react", () => ({
  useAnalyzeTrading: useAnalyzeTradingMock,
  useAnalyzeMarketData: useAnalyzeMarketDataMock,
  useGetMarketDataStatus: useGetMarketDataStatusMock,
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: useAuthMock,
}));

import { TradingPage } from "./TradingPage";

const noTradeResult = {
  requestedSymbol: "XAUUSDm",
  canonicalSymbol: "XAUUSD",
  instrumentClass: "gold",
  marketSchedule: "broker_defined",
  dataSource: "user_supplied_historical",
  analysisTimestamp: 1_800_000_000_000,
  lastMarketTimestamp: 1_799_999_900_000,
  marketFreshness: "fresh",
  currentPrice: 2350.25,
  higherTimeframeBias: "neutral",
  conflicts: [],
  timeframes: ["1D", "4H", "1H", "30M"].map((timeframe) => ({
    timeframe,
    dataStatus: "available",
    bias: "neutral",
    structure: "Range / structure not confirmed",
    concepts: [],
    indicators: null,
  })),
  signal: {
    decision: "NO_TRADE",
    status: "valid",
    setupTimeframe: "30M",
    entryPrice: null,
    entryLow: null,
    entryHigh: null,
    stopLoss: null,
    targets: [],
    confidence: 20,
    confidenceExplanation: "No aligned setup.",
    evidence: [],
    invalidationConditions: ["Re-analyze when conditions change."],
    expiresAt: null,
  },
  macroContext: {
    status: "unavailable",
    supportedEvents: ["CPI", "PPI", "NFP", "FOMC"],
    excludedEvent: "PCE",
    hypothesisPercent: null,
    explanation: "No reliable news/calendar source is connected.",
  },
};

describe("TradingPage", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    providerMutateMock.mockReset();
    useAuthMock.mockReset();
    refetchStatusMock.mockReset();
    useAuthMock.mockReturnValue({
      session: { access_token: "test-member-token", user: { id: "member-a" } },
    });
    useAnalyzeTradingMock.mockImplementation(() => ({
      mutate: (variables: unknown, options?: unknown) => mutateMock(variables, options),
      isPending: false,
      isError: false,
      error: null,
    }));
    useAnalyzeMarketDataMock.mockImplementation(() => ({
      mutate: (variables: unknown, options?: unknown) => providerMutateMock(variables, options),
      isPending: false,
      isError: false,
      error: null,
    }));
    useGetMarketDataStatusMock.mockImplementation(() => ({
      data: {
        providerId: "none",
        providerName: "No provider selected",
        connectionState: "configuration_required",
        dataMode: "unavailable",
        lastSuccessfulUpdateAt: null,
        supportedInstrumentClasses: ["gold", "bitcoin", "forex", "index"],
        message: "Provider configuration is required. CSV imports remain available.",
      },
      refetch: refetchStatusMock,
      isLoading: false,
      isError: false,
    }));
  });
  afterEach(() => cleanup());

  function useConfiguredProviderStatus() {
    useGetMarketDataStatusMock.mockReturnValue({
      data: {
        providerId: "twelvedata",
        providerName: "Twelve Data",
        connectionState: "disconnected",
        dataMode: "live",
        lastSuccessfulUpdateAt: null,
        supportedInstrumentClasses: ["gold", "bitcoin", "forex", "index"],
        message: "Provider is configured; fetch data to verify connectivity.",
      },
      refetch: refetchStatusMock,
      isLoading: false,
      isError: false,
    });
  }

  function providerResponse(symbol: string) {
    return {
      providerId: "twelvedata",
      providerName: "Twelve Data",
      providerSymbol: symbol === "BTCUSD" ? "BTC/USD" : "XAU/USD",
      providerExchange: "Test Exchange",
      dataMode: "live",
      freshness: "fresh",
      quote: {
        symbol: symbol === "BTCUSD" ? "BTC/USD" : "XAU/USD",
        exchange: "Test Exchange",
        price: 2350.25,
        timestamp: 1_799_999_900_000,
        marketOpen: true,
      },
      lastSuccessfulUpdateAt: 1_800_000_000_000,
      warnings: [],
      analysis: { ...noTradeResult, requestedSymbol: symbol, dataSource: "provider_live" },
    };
  }

  function resolveProviderRequest(index: number, symbol: string) {
    const callbacks = providerMutateMock.mock.calls[index][1] as {
      onSuccess?: (value: unknown) => void;
    };
    callbacks.onSuccess?.(providerResponse(symbol));
  }

  function resolveCsvRequest(index: number) {
    const callbacks = mutateMock.mock.calls[index][1] as {
      onSuccess?: (value: typeof noTradeResult) => void;
    };
    callbacks.onSuccess?.(noTradeResult);
  }

  it("shows the actual provider readiness and does not show fictional market data", () => {
    render(<TradingPage />);
    expect(screen.getByTestId("status-market-data").textContent).toBe("Configuration required");
    expect(screen.getByText(/provider configuration is required/i)).toBeTruthy();
    expect(screen.getByTestId("button-analyze-provider").hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Sample #842")).toBeNull();
    expect(screen.queryByText("2,184.30")).toBeNull();
    expect(screen.queryByText("Valid Setup")).toBeNull();
  });

  it("uploads broker CSV candles and displays the server's explicit NO TRADE response", async () => {
    render(<TradingPage />);
    const input = screen.getByTestId("input-market-csv-30M") as HTMLInputElement;
    const csv = "timestamp,open,high,low,close\n1700000000,100,102,99,101";
    const file = new File([csv], "broker-30m.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => csv });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/1 historical candles · broker-30m\.csv/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("button-analyze-market"));

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    const request = mutateMock.mock.calls[0][0] as {
      data: { symbol: string; timeframes: Record<string, unknown[]> };
    };
    expect(request.data.symbol).toBe("XAUUSD");
    expect(request.data.timeframes["30M"]).toHaveLength(1);
    resolveCsvRequest(0);
    const decision = await screen.findByTestId("status-trading-decision");
    expect(decision.textContent).toBe("NO_TRADE");
    expect(screen.getByText("User-supplied historical data")).toBeTruthy();
  });

  it("uses the protected provider-analysis request and displays real source metadata", async () => {
    useConfiguredProviderStatus();
    render(<TradingPage />);
    fireEvent.click(screen.getByTestId("button-analyze-provider"));

    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(1));
    expect(providerMutateMock.mock.calls[0][0]).toEqual({ data: { symbol: "XAUUSD" } });
    resolveProviderRequest(0, "XAUUSD");
    expect(await screen.findByText("Live provider data")).toBeTruthy();
    expect(screen.getByText("Data by Twelve Data")).toBeTruthy();
    expect(screen.getByTestId("status-trading-decision").textContent).toBe("NO_TRADE");
    expect(refetchStatusMock).toHaveBeenCalledTimes(1);
  });

  it("ignores provider results after the selected instrument changes", async () => {
    useConfiguredProviderStatus();
    render(<TradingPage />);
    fireEvent.click(screen.getByTestId("button-analyze-provider"));
    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByTestId("input-trading-symbol"), {
      target: { value: "BTCUSD" },
    });
    resolveProviderRequest(0, "XAUUSD");

    expect(screen.queryByText("Live provider data")).toBeNull();
    expect(screen.queryByRole("heading", { name: "XAUUSDm" })).toBeNull();
    expect(refetchStatusMock).not.toHaveBeenCalled();
  });

  it("keeps the newest provider request when an older response finishes last", async () => {
    useConfiguredProviderStatus();
    render(<TradingPage />);
    fireEvent.click(screen.getByTestId("button-analyze-provider"));
    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByTestId("input-trading-symbol"), {
      target: { value: "BTCUSD" },
    });
    fireEvent.click(screen.getByTestId("button-analyze-provider"));
    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(2));

    resolveProviderRequest(1, "BTCUSD");
    await screen.findByRole("heading", { name: "BTCUSD" });
    resolveProviderRequest(0, "XAUUSD");

    expect(screen.getByRole("heading", { name: "BTCUSD" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "XAUUSDm" })).toBeNull();
  });

  it("does not let a provider response replace a newer CSV analysis", async () => {
    useConfiguredProviderStatus();
    render(<TradingPage />);
    fireEvent.click(screen.getByTestId("button-analyze-provider"));
    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTestId("button-analyze-market"));
    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    resolveCsvRequest(0);
    resolveProviderRequest(0, "XAUUSD");

    expect(await screen.findByText("Imported candle analysis")).toBeTruthy();
    expect(screen.queryByText("Live provider data")).toBeNull();
  });

  it("does not let an older CSV response replace a newer provider analysis", async () => {
    useConfiguredProviderStatus();
    render(<TradingPage />);
    fireEvent.click(screen.getByTestId("button-analyze-market"));
    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTestId("button-analyze-provider"));
    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(1));
    resolveProviderRequest(0, "XAUUSD");
    await screen.findByText("Live provider data");
    resolveCsvRequest(0);

    expect(screen.getByText("Live provider data")).toBeTruthy();
    expect(screen.queryByText("Imported candle analysis")).toBeNull();
  });

  it("keys provider readiness by member and ignores responses after an account switch", async () => {
    useConfiguredProviderStatus();
    const { rerender } = render(<TradingPage />);
    const initialOptions = useGetMarketDataStatusMock.mock.calls.at(-1)?.[0] as {
      query: { queryKey: unknown[] };
    };
    expect(initialOptions.query.queryKey).toEqual([
      "/api/workspace/market-data/status",
      "member-a",
    ]);

    fireEvent.click(screen.getByTestId("button-analyze-provider"));
    await waitFor(() => expect(providerMutateMock).toHaveBeenCalledTimes(1));
    useAuthMock.mockReturnValue({
      session: { access_token: "another-member-token", user: { id: "member-b" } },
    });
    rerender(<TradingPage />);

    const switchedOptions = useGetMarketDataStatusMock.mock.calls.at(-1)?.[0] as {
      query: { queryKey: unknown[] };
    };
    expect(switchedOptions.query.queryKey).toEqual([
      "/api/workspace/market-data/status",
      "member-b",
    ]);
    resolveProviderRequest(0, "XAUUSD");
    expect(screen.queryByText("Live provider data")).toBeNull();
  });
});
