// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { TradingCandle, TradingSignal } from "@workspace/api-zod";
import { checkSignalValidity } from "../src/lib/trading-signal-validity";

const source = 1_800_000_000_000;
const proposal: TradingSignal = {
  decision: "BUY", status: "valid", setupTimeframe: "30M",
  entryPrice: 100, entryLow: 100, entryHigh: 100, stopLoss: 98,
  targets: [{ label: "TP1", price: 104, riskReward: 2 }],
  confidence: 75, confidenceExplanation: "Test confluence",
  evidence: ["Synthetic unit-test data only"],
  invalidationConditions: ["Stop crossing or expiry"],
  expiresAt: source + 60 * 60_000,
};
const bar = (timestamp: number, low = 99, high = 102): TradingCandle => ({
  timestamp, open: 100, high, low, close: 101,
});

describe("signal invalidation using subsequently observed candles", () => {
  it("keeps a still-current proposal within its review window", () => {
    expect(checkSignalValidity(proposal, [bar(source)], "bullish", source + 30 * 60_000)).toEqual(proposal);
  });
  it("invalidates a BUY when later observed lows cross the stop", () => {
    const result = checkSignalValidity(proposal, [bar(source), bar(source + 30 * 60_000, 97)], "bullish", source + 60 * 60_000);
    expect(result.decision).toBe("NO_TRADE");
    expect(result.status).toBe("expired");
    expect(result.confidenceExplanation).toMatch(/stop-loss/);
    expect(result.targets).toEqual([]);
  });
  it("invalidates a SELL when later highs cross its stop", () => {
    const sell: TradingSignal = {
      ...proposal, decision: "SELL", stopLoss: 102,
      targets: [{ label: "TP1", price: 96, riskReward: 2 }],
    };
    const result = checkSignalValidity(sell, [bar(source), bar(source + 30 * 60_000, 99, 103)], "bearish", source + 60 * 60_000);
    expect(result.decision).toBe("NO_TRADE");
    expect(result.confidenceExplanation).toMatch(/stop-loss/);
  });
  it("invalidates an old entry when its first target already traded", () => {
    const result = checkSignalValidity(proposal, [bar(source), bar(source + 30 * 60_000, 99, 105)], "bullish", source + 60 * 60_000);
    expect(result.decision).toBe("NO_TRADE");
    expect(result.confidenceExplanation).toMatch(/target has already/);
  });
  it("expires the proposal by time and rejects a new opposite higher-timeframe bias", () => {
    expect(checkSignalValidity(proposal, [bar(source)], "bullish", source + 61 * 60_000).status).toBe("expired");
    const reversal = checkSignalValidity(proposal, [bar(source)], "bearish", source + 30 * 60_000);
    expect(reversal.decision).toBe("NO_TRADE");
    expect(reversal.confidenceExplanation).toMatch(/higher-timeframe/);
  });
});
