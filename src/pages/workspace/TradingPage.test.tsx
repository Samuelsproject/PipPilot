import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mutateMock, useAnalyzeTradingMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  useAnalyzeTradingMock: vi.fn(),
}));

vi.mock("@workspace/api-client-react", () => ({
  useAnalyzeTrading: useAnalyzeTradingMock,
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ session: { access_token: "test-member-token" } }),
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
    useAnalyzeTradingMock.mockImplementation(() => ({
      mutate: (variables: unknown, options?: { onSuccess?: (value: typeof noTradeResult) => void }) => {
        mutateMock(variables);
        options?.onSuccess?.(noTradeResult);
      },
      isPending: false,
      isError: false,
      error: null,
    }));
  });
  afterEach(() => cleanup());

  it("states that live data is unavailable and does not show the previous fictional setup", () => {
    render(<TradingPage />);
    expect(screen.getByText("No live data provider")).toBeTruthy();
    expect(screen.getByText(/no live or delayed market feed is connected/i)).toBeTruthy();
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
    const decision = await screen.findByTestId("status-trading-decision");
    expect(decision.textContent).toBe("NO_TRADE");
    expect(screen.getByText("User-supplied historical data")).toBeTruthy();
  });
});
