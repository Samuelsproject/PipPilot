import type { TradingBias, TradingCandle, TradingSignal } from "@workspace/api-zod";

/**
 * Re-evaluate a previously calculated proposal against later observed bars.
 * No market data is fetched here; absence of a new quote never implies validity.
 * This is also used on every freshly calculated proposal before it is returned.
 */
export function checkSignalValidity(
  signal: TradingSignal,
  candles: TradingCandle[],
  higherTimeframeBias: TradingBias,
  now: number,
): TradingSignal {
  if (signal.decision === "NO_TRADE") return signal;
  let reason: string | null = null;
  let status: TradingSignal["status"] = "expired";
  const latest = candles.at(-1);
  const sourceOpen = signal.expiresAt == null ? null : signal.expiresAt - 60 * 60_000;
  const laterBars = sourceOpen == null ? [] : candles.filter((candle) => candle.timestamp > sourceOpen);
  if (
    signal.stopLoss == null ||
    signal.entryPrice == null ||
    !latest ||
    signal.expiresAt == null
  ) {
    reason = "The proposal cannot be verified because its price, invalidation, or source bars are missing.";
    status = "unavailable";
  } else if (laterBars.some((candle) => signal.decision === "BUY"
    ? candle.low <= signal.stopLoss!
    : candle.high >= signal.stopLoss!)) {
    reason = "A subsequently observed candle crossed the stop-loss invalidation level.";
  } else if (
    (signal.decision === "BUY" && higherTimeframeBias === "bearish") ||
    (signal.decision === "SELL" && higherTimeframeBias === "bullish")
  ) {
    reason = "New higher-timeframe structure opposes the proposal.";
  } else if (signal.targets[0] && laterBars.some((candle) => signal.decision === "BUY"
    ? candle.high >= signal.targets[0].price
    : candle.low <= signal.targets[0].price)) {
    reason = "The first calculated target has already been reached; do not enter the old proposal.";
  } else if (now > signal.expiresAt) {
    reason = "The two-candle review window has expired.";
  } else if (now - latest.timestamp > 60 * 60_000) {
    reason = "Source data is stale; a new observed candle set is required.";
    status = "stale";
  }
  if (!reason) return signal;
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
    confidenceExplanation: `NO TRADE: ${reason}`,
    invalidationConditions: [...signal.invalidationConditions, reason],
  };
}
