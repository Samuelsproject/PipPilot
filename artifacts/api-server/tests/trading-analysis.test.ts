// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { TradingAnalysisInput, TradingCandle, TradingTimeframe } from "@workspace/api-zod";
import { analyzeTrading } from "../src/lib/trading-analysis";

const INTERVAL: Record<TradingTimeframe, number> = {
  "30M": 30 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
};
const NOW = 1_800_000_000_000;

function candlesFor(
  timeframe: TradingTimeframe,
  direction: "bullish" | "bearish",
  count = 64,
  origin = NOW,
): TradingCandle[] {
  const sign = direction === "bullish" ? 1 : -1;
  return Array.from({ length: count }, (_, index) => {
    const center = 1_000 + sign * (index * 0.35 + Math.sin(index * 1.3) * 0.8);
    const close = center;
    const open = close - sign * 0.08;
    return {
      timestamp: origin - (count - index) * INTERVAL[timeframe],
      open,
      high: Math.max(open, close) + 0.15,
      low: Math.min(open, close) - 0.15,
      close,
      volume: 100 + index,
    };
  });
}

function addTrigger(
  candles: TradingCandle[],
  direction: "bullish" | "bearish",
): TradingCandle[] {
  const result = candles.map((candle) => ({ ...candle }));
  const prior = result[result.length - 1];
  const pivots = result.flatMap((candle, index) => {
    if (index < 2 || index >= result.length - 2) return [];
    const neighbors = result.slice(index - 2, index + 3).filter((_, offset) => offset !== 2);
    const isPivot = direction === "bullish"
      ? neighbors.every((item) => candle.low <= item.low)
      : neighbors.every((item) => candle.high >= item.high);
    return isPivot ? [direction === "bullish" ? candle.low : candle.high] : [];
  });
  const sweptLevel = pivots.at(-1) ?? (direction === "bullish" ? prior.low : prior.high);
  const close = direction === "bullish"
    ? Math.max(prior.close + 0.02, sweptLevel + 0.1)
    : Math.min(prior.close - 0.02, sweptLevel - 0.1);
  result.push({
    timestamp: prior.timestamp + INTERVAL["30M"],
    open: direction === "bullish" ? close - 0.08 : close + 0.08,
    high: direction === "bullish"
      ? Math.max(prior.high, close + 0.1)
      : sweptLevel + 0.05,
    low: direction === "bullish"
      ? sweptLevel - 0.05
      : Math.min(prior.low, close - 0.1),
    close,
  });
  return result;
}

function completeInput(
  symbol: string,
  direction: "bullish" | "bearish" = "bullish",
  origin = NOW,
): TradingAnalysisInput {
  return {
    symbol,
    timeframes: {
      "1D": candlesFor("1D", direction, 64, origin),
      "4H": candlesFor("4H", direction, 64, origin),
      "1H": candlesFor("1H", direction, 64, origin),
      "30M": addTrigger(candlesFor("30M", direction, 64, origin - INTERVAL["30M"]), direction),
    },
  };
}

describe("data-driven multi-timeframe trading analysis", () => {
  it("returns NO TRADE when market data is unavailable and never supplies a quote", () => {
    const result = analyzeTrading({ symbol: "BTCUSD", timeframes: {} }, NOW);
    expect(result.dataSource).toBe("unavailable");
    expect(result.currentPrice).toBeNull();
    expect(result.signal.decision).toBe("NO_TRADE");
    expect(result.signal.status).toBe("unavailable");
    expect(result.macroContext.hypothesisPercent).toBeNull();
    expect(result.macroContext.supportedEvents).toEqual(["CPI", "PPI", "NFP", "FOMC"]);
    expect(result.macroContext.excludedEvent).toBe("PCE");
  });

  it.each([
    ["XAUUSDm", "XAUUSD", "gold"],
    ["m.BTCUSD.a", "BTCUSD", "bitcoin"],
    ["BTCUSDT", "BTCUSDT", "bitcoin"],
    ["BTCEUR", "BTCEUR", "bitcoin"],
    ["XBTUSD.r", "BTCUSD", "bitcoin"],
    ["EURUSDpro", "EURUSD", "forex"],
    ["US30.cash", "US30", "index"],
    ["NAS100.", "US100", "index"],
  ] as const)("normalizes broker alias %s without claiming a data connection", (symbol, canonical, instrumentClass) => {
    const result = analyzeTrading({ symbol, timeframes: {} }, NOW);
    expect(result.canonicalSymbol).toBe(canonical);
    expect(result.instrumentClass).toBe(instrumentClass);
    expect(result.dataSource).toBe("unavailable");
    if (instrumentClass === "bitcoin") expect(result.marketSchedule).toBe("continuous_24_7");
  });

  it("produces a BUY only when the four supplied timeframes align with a 30M reclaim", () => {
    const result = analyzeTrading(completeInput("BTCUSD"), NOW);
    expect(result.dataSource).toBe("user_supplied_historical");
    expect(result.marketSchedule).toBe("continuous_24_7");
    expect(result.higherTimeframeBias).toBe("bullish");
    expect(result.signal.decision, result.signal.confidenceExplanation + JSON.stringify(result.conflicts)).toBe("BUY");
    expect(result.signal.status).toBe("valid");
    expect(result.signal.setupTimeframe).toBe("30M");
    expect(result.signal.stopLoss).toBeLessThan(result.signal.entryPrice!);
    expect(result.signal.targets).toHaveLength(3);
    expect(result.signal.targets.map((target) => target.riskReward)).toEqual([2, 3, 4]);
    for (const target of result.signal.targets) {
      expect((target.price - result.signal.entryPrice!) /
        (result.signal.entryPrice! - result.signal.stopLoss!)).toBeCloseTo(target.riskReward);
    }
    expect(result.signal.evidence.some((item) => item.includes("LIQUIDITY_SWEEP") || item.includes("CRT_INTRADAY"))).toBe(true);
  });

  it("produces SELL analysis for aligned bearish gold, forex, and index structure", () => {
    for (const symbol of ["XAUUSD", "GBPJPY", "US100"]) {
      const result = analyzeTrading(completeInput(symbol, "bearish"), NOW);
      expect(result.signal.decision, `${symbol}: ${result.signal.confidenceExplanation} ${JSON.stringify(result.conflicts)}`).toBe("SELL");
      expect(result.signal.stopLoss).toBeGreaterThan(result.signal.entryPrice!);
      expect(result.signal.targets).toHaveLength(3);
    }
  });

  it("keeps a higher-timeframe disagreement explicit and returns NO TRADE", () => {
    const input = completeInput("EURUSD");
    input.timeframes["1D"] = candlesFor("1D", "bearish", 64);
    const result = analyzeTrading(input, NOW);
    expect(result.signal.decision).toBe("NO_TRADE");
    expect(result.higherTimeframeBias).toBe("neutral");
    expect(result.conflicts.some((conflict) => conflict.includes("Daily bias"))).toBe(true);
    expect(result.signal.confidence).toBeLessThan(50);
  });

  it("does not invent 4H confirmation when it is neutral and reduces confidence", () => {
    const input = completeInput("BTCUSD");
    input.timeframes["4H"] = input.timeframes["4H"]!.map((candle) => ({
      ...candle, open: 1000, high: 1001, low: 999, close: 1000,
    }));
    const result = analyzeTrading(input, NOW);
    const aligned = analyzeTrading(completeInput("BTCUSD"), NOW);
    expect(result.signal.decision).toBe("BUY");
    expect(result.timeframes.find((entry) => entry.timeframe === "4H")?.bias).toBe("neutral");
    expect(result.signal.evidence.join(" ")).toMatch(/neutral, not confirming/);
    expect(result.signal.confidence).toBeLessThan(aligned.signal.confidence);
  });

  it("reports missing and insufficient timeframes instead of filling gaps", () => {
    const result = analyzeTrading({
      symbol: "US30",
      timeframes: { "1D": candlesFor("1D", "bullish").slice(0, 12) },
    }, NOW);
    expect(result.signal.decision).toBe("NO_TRADE");
    expect(result.timeframes.find((entry) => entry.timeframe === "1D")?.dataStatus).toBe("insufficient");
    expect(result.timeframes.find((entry) => entry.timeframe === "4H")?.dataStatus).toBe("missing");
  });

  it("marks stale supplied candles and does not emit an actionable signal", () => {
    const old = NOW - 10 * 24 * 60 * 60_000;
    const result = analyzeTrading(completeInput("BTCUSD", "bullish", old), NOW);
    expect(result.dataSource).toBe("user_supplied_historical");
    expect(result.marketFreshness).toBe("stale");
    expect(result.signal.decision).toBe("NO_TRADE");
    expect(result.signal.status).toBe("stale");
  });

  it("marks a still-fresh but expired 30M setup as expired", () => {
    const input = completeInput("XAUUSD");
    const latest = input.timeframes["30M"]!.at(-1)!;
    const nowAfterExpiry = latest.timestamp + 70 * 60_000;
    const result = analyzeTrading(input, nowAfterExpiry);
    expect(result.signal.decision).toBe("NO_TRADE");
    expect(result.signal.status).toBe("expired");
  });

  it("rejects impossible OHLC values and unordered candles", () => {
    const impossible = completeInput("BTCUSD");
    impossible.timeframes["30M"]![3].high = 1;
    expect(() => analyzeTrading(impossible, NOW)).toThrow(/invalid OHLC/i);

    const unordered = completeInput("BTCUSD");
    unordered.timeframes["1H"]![4].timestamp = unordered.timeframes["1H"]![3].timestamp;
    expect(() => analyzeTrading(unordered, NOW)).toThrow(/strictly increasing/i);
  });

  it("rejects future timestamps and overlapping candle intervals", () => {
    const future = completeInput("BTCUSD");
    future.timeframes["30M"]!.at(-1)!.timestamp = NOW + 60_000;
    expect(() => analyzeTrading(future, NOW)).toThrow(/invalid OHLC/);
    const overlapping = completeInput("BTCUSD");
    overlapping.timeframes["1H"]![1].timestamp = overlapping.timeframes["1H"]![0].timestamp + 1;
    expect(() => analyzeTrading(overlapping, NOW)).toThrow(/overlapping/);
  });

  it("ignores unfinished bars rather than using their changing closes for confirmation", () => {
    const input = completeInput("BTCUSD");
    const last = input.timeframes["30M"]!.at(-1)!;
    input.timeframes["30M"]!.push({ ...last, timestamp: NOW, close: last.open });
    const result = analyzeTrading(input, NOW);
    expect(result.currentPrice).toBe(last.close);
  });

  it("uses exchange-local daily boundaries across spring and fall DST changes", () => {
    const candle = (timestamp: number): TradingCandle => ({
      timestamp,
      open: 1.1,
      high: 1.2,
      low: 1.0,
      close: 1.15,
    });

    const spring = analyzeTrading({
      symbol: "EURUSD",
      timeframes: {
        "1D": [
          candle(Date.parse("2026-03-08T05:00:00Z")),
          candle(Date.parse("2026-03-09T04:00:00Z")),
        ],
      },
    }, Date.parse("2026-03-09T04:30:00Z"), { dailyTimeZone: "America/New_York" });
    expect(spring.timeframes.find((item) => item.timeframe === "1D")?.dataStatus)
      .toBe("insufficient");

    const fallBar = candle(Date.parse("2026-11-01T04:00:00Z"));
    const beforeFallClose = analyzeTrading({
      symbol: "EURUSD",
      timeframes: { "1D": [fallBar] },
    }, Date.parse("2026-11-02T04:30:00Z"), { dailyTimeZone: "America/New_York" });
    expect(beforeFallClose.timeframes.find((item) => item.timeframe === "1D")?.dataStatus)
      .toBe("missing");

    const afterFallClose = analyzeTrading({
      symbol: "EURUSD",
      timeframes: { "1D": [fallBar] },
    }, Date.parse("2026-11-02T05:00:00Z"), { dailyTimeZone: "America/New_York" });
    expect(afterFallClose.timeframes.find((item) => item.timeframe === "1D")?.dataStatus)
      .toBe("insufficient");
  });

  it("keeps BTC on a continuous 24/7 schedule during weekend analysis", () => {
    const sunday = Date.parse("2026-11-15T12:00:00Z");
    const result = analyzeTrading(completeInput("BTCUSD", "bullish", sunday), sunday);
    expect(result.marketSchedule).toBe("continuous_24_7");
    expect(result.marketFreshness).toBe("fresh");
    expect(result.signal.decision).toBe("BUY");
  });

  it("detects structure breaks, displacement, order blocks, FVGs, and premium/discount evidence", () => {
    const input = completeInput("BTCUSD");
    const candles = input.timeframes["1H"]!;
    const prior = candles[candles.length - 1];
    candles[candles.length - 2] = {
      ...candles[candles.length - 2],
      open: prior.close + 0.8,
      close: prior.close - 0.8,
      high: prior.close + 1,
      low: prior.close - 1,
    };
    candles[candles.length - 1] = {
      ...prior,
      open: prior.close - 1,
      close: prior.high + 4,
      high: prior.high + 4.5,
      low: prior.close - 1.2,
    };
    const result = analyzeTrading(input, NOW);
    const kinds = result.timeframes.find((entry) => entry.timeframe === "1H")!.concepts.map((concept) => concept.kind);
    expect(kinds).toContain("BOS");
    expect(kinds).toContain("DISPLACEMENT");
    expect(kinds).toContain("ORDER_BLOCK");
    expect(kinds).toContain("SUPPLY_DEMAND");
    expect(kinds).toContain("PREMIUM_DISCOUNT");
  });

  it("detects a CHOCH when a bearish swing sequence closes above its confirmed swing high", () => {
    const input = completeInput("EURUSD", "bearish");
    const candles = input.timeframes["1H"]!;
    const last = candles[candles.length - 1];
    const highestPrior = Math.max(...candles.slice(0, -1).map((candle) => candle.high));
    candles[candles.length - 1] = {
      ...last,
      open: highestPrior - 0.5,
      close: highestPrior + 2,
      high: highestPrior + 2.5,
      low: highestPrior - 0.8,
    };
    const result = analyzeTrading(input, NOW);
    expect(result.timeframes.find((entry) => entry.timeframe === "1H")?.concepts.map((concept) => concept.kind)).toContain("CHOCH");
  });

  it("detects an FVG only when three-candle separation has a displacement-sized middle body", () => {
    const input = completeInput("XAUUSD");
    const candles = input.timeframes["4H"]!;
    const start = candles.length - 3;
    const anchor = candles[start - 1].close;
    candles[start] = {
      ...candles[start],
      open: anchor,
      close: anchor + 0.1,
      high: anchor + 0.3,
      low: anchor - 0.3,
    };
    candles[start + 1] = {
      ...candles[start + 1],
      open: anchor + 0.4,
      close: anchor + 2,
      high: anchor + 2.2,
      low: anchor + 0.35,
    };
    candles[start + 2] = {
      ...candles[start + 2],
      open: anchor + 2.5,
      close: anchor + 2.8,
      high: anchor + 3,
      low: anchor + 2.4,
    };
    const result = analyzeTrading(input, NOW);
    const concepts = result.timeframes.find((entry) => entry.timeframe === "4H")!.concepts;
    expect(concepts.some((concept) => concept.kind === "FAIR_VALUE_GAP" && concept.evidence.includes("Three-candle gap"))).toBe(true);
  });

  it("detects intraday and swing CRT and liquidity-sweep evidence", () => {
    const input = completeInput("BTCUSD");
    const daily = input.timeframes["1D"]!;
    const prior = daily[daily.length - 2];
    daily[daily.length - 1] = {
      ...daily[daily.length - 1],
      open: prior.close - 0.2,
      close: prior.close + 0.1,
      high: prior.high,
      low: prior.low - 0.2,
    };
    const result = analyzeTrading(input, NOW);
    const thirtyKinds = result.timeframes.find((entry) => entry.timeframe === "30M")!.concepts.map((concept) => concept.kind);
    const dailyKinds = result.timeframes.find((entry) => entry.timeframe === "1D")!.concepts.map((concept) => concept.kind);
    expect(thirtyKinds).toContain("LIQUIDITY_SWEEP");
    expect(thirtyKinds).toContain("CRT_INTRADAY");
    expect(dailyKinds).toContain("CRT_SWING");
  });

  it("flags equal highs and lows only when separate confirmed swings cluster", () => {
    const input = completeInput("US30");
    const candles = input.timeframes["1H"]!;
    const peakOne = candles.length - 10;
    const peakTwo = candles.length - 5;
    const peak = candles[peakOne].close + 5;
    for (const center of [peakOne, peakTwo]) {
      for (let index = center - 2; index <= center + 2; index += 1) {
        candles[index] = {
          ...candles[index],
          open: peak - 2,
          close: peak - 1.5,
          high: index === center ? peak : peak - 0.8,
          low: peak - 3,
        };
      }
    }
    const result = analyzeTrading(input, NOW);
    const kinds = result.timeframes.find((entry) => entry.timeframe === "1H")!.concepts.map((concept) => concept.kind);
    expect(kinds).toContain("EQUAL_HIGHS");
  });

  it("rejects unsupported symbols without fabricating a setup", () => {
    const result = analyzeTrading(completeInput("METEOR123"), NOW);
    expect(result.instrumentClass).toBe("unsupported");
    expect(result.signal.decision).toBe("NO_TRADE");
    expect(result.signal.status).toBe("unavailable");
  });
});
