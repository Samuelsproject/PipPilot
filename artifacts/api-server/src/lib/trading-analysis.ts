import type {
  TradingAnalysisInput,
  TradingAnalysisResponse,
  TradingBias,
  TradingCandle,
  TradingConcept,
  TradingIndicators,
  TradingSignal,
  TradingTimeframe,
  TradingTimeframeAnalysis,
} from "@workspace/api-zod";

const TIMEFRAMES: readonly TradingTimeframe[] = ["1D", "4H", "1H", "30M"];
const TIMEFRAME_MS: Record<TradingTimeframe, number> = {
  "30M": 30 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
};
const MIN_CANDLES = 20;

type InstrumentClass = TradingAnalysisResponse["instrumentClass"];
type Direction = "bullish" | "bearish" | "neutral";
type Pivot = { index: number; price: number };
type Zone = { low: number; high: number; index: number };
type TimeframeState = {
  candles: TradingCandle[];
  analysis: TradingTimeframeAnalysis;
  atr: number;
  swingHighs: Pivot[];
  swingLows: Pivot[];
  orderBlock: Zone | null;
  fvg: Zone | null;
  crtDirection: Direction | null;
  sweepDirection: Direction | null;
};

export class TradingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TradingInputError";
  }
}

const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF",
  "NOK", "SEK", "SGD", "HKD", "MXN", "ZAR", "TRY", "PLN",
  "CNH", "CNY",
];

function normalizeSymbol(symbol: string): {
  canonical: string | null;
  instrumentClass: InstrumentClass;
  marketSchedule: TradingAnalysisResponse["marketSchedule"];
} {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const compact = normalized.replace(/^\d+/, "");
  const includes = (candidates: string[]) =>
    candidates.find((candidate) =>
      normalized.includes(candidate) || compact.includes(candidate),
    );

  const cryptoQuotes = "USDT|USDC|USD|EUR|GBP|JPY|AUD|CAD|CHF";
  const cryptoPair = new RegExp(`(?:BTC|XBT)(${cryptoQuotes})`);
  const reverseCryptoPair = new RegExp(`(${cryptoQuotes})(?:BTC|XBT)`);
  if (cryptoPair.test(normalized) || cryptoPair.test(compact)) {
    const quote = normalized.match(cryptoPair)?.[1]
      ?? compact.match(cryptoPair)?.[1]
      ?? "USD";
    return {
      canonical: `BTC${quote}`,
      instrumentClass: "bitcoin",
      marketSchedule: "continuous_24_7",
    };
  }
  if (reverseCryptoPair.test(normalized) || reverseCryptoPair.test(compact)) {
    const quote = normalized.match(reverseCryptoPair)?.[1]
      ?? compact.match(reverseCryptoPair)?.[1]
      ?? "USDT";
    return {
      canonical: `BTC${quote}`,
      instrumentClass: "bitcoin",
      marketSchedule: "continuous_24_7",
    };
  }

  if (includes(["XAUUSD", "GOLD"])) {
    return { canonical: "XAUUSD", instrumentClass: "gold", marketSchedule: "broker_defined" };
  }

  const indexAliases: Record<string, string[]> = {
    US30: ["US30", "DJI", "DJ30", "WS30"],
    US100: ["US100", "NAS100", "USTEC", "NASDAQ"],
  };
  for (const [canonical, aliases] of Object.entries(indexAliases)) {
    if (includes(aliases)) {
      return { canonical, instrumentClass: "index", marketSchedule: "broker_defined" };
    }
  }

  for (const base of CURRENCIES) {
    for (const quote of CURRENCIES) {
      if (base === quote) continue;
      if (normalized.includes(`${base}${quote}`) || compact.includes(`${base}${quote}`)) {
        return {
          canonical: `${base}${quote}`,
          instrumentClass: "forex",
          marketSchedule: "fx_weekdays",
        };
      }
    }
  }
  return { canonical: null, instrumentClass: "unsupported", marketSchedule: "unavailable" };
}

function validateCandles(timeframe: TradingTimeframe, candles: TradingCandle[]): void {
  if (candles.length > 200) {
    throw new TradingInputError(`${timeframe} accepts at most 200 candles.`);
  }
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    if (
      !Number.isSafeInteger(candle.timestamp) ||
      candle.timestamp <= 0 ||
      ![candle.open, candle.high, candle.low, candle.close].every(Number.isFinite) ||
      candle.high < Math.max(candle.open, candle.close, candle.low) ||
      candle.low > Math.min(candle.open, candle.close, candle.high) ||
      (candle.volume !== undefined && (!Number.isFinite(candle.volume) || candle.volume < 0))
    ) {
      throw new TradingInputError(`${timeframe} contains an invalid OHLC candle at row ${index + 1}.`);
    }
    if (index > 0 && candle.timestamp <= candles[index - 1].timestamp) {
      throw new TradingInputError(`${timeframe} candle timestamps must be strictly increasing.`);
    }
  }
}

function averageTrueRange(candles: TradingCandle[]): number {
  const ranges = candles.slice(1).map((candle, index) => {
    const previousClose = candles[index].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });
  const recent = ranges.slice(-14);
  return recent.length ? recent.reduce((sum, value) => sum + value, 0) / recent.length : 0;
}

function ema(values: number[], period: number): number {
  const alpha = 2 / (period + 1);
  return values.reduce((current, value, index) =>
    index === 0 ? value : alpha * value + (1 - alpha) * current, values[0] ?? 0);
}

function rsi(values: number[], period = 14): number {
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  if (!recent.length) return 50;
  const gains = recent.reduce((sum, change) => sum + Math.max(change, 0), 0) / recent.length;
  const losses = recent.reduce((sum, change) => sum + Math.max(-change, 0), 0) / recent.length;
  if (losses === 0) return gains === 0 ? 50 : 100;
  return 100 - 100 / (1 + gains / losses);
}

function findPivots(candles: TradingCandle[], key: "high" | "low"): Pivot[] {
  const pivots: Pivot[] = [];
  for (let index = 2; index < candles.length - 2; index += 1) {
    const price = candles[index][key];
    const neighbors = candles.slice(index - 2, index + 3).filter((_, offset) => offset !== 2);
    const isPivot = key === "high"
      ? neighbors.every((candle) => price >= candle.high)
      : neighbors.every((candle) => price <= candle.low);
    if (isPivot) pivots.push({ index, price });
  }
  return pivots;
}

function trendFromPivots(highs: Pivot[], lows: Pivot[]): Direction {
  const recentHighs = highs.slice(-2);
  const recentLows = lows.slice(-2);
  if (recentHighs.length < 2 || recentLows.length < 2) return "neutral";
  if (
    recentHighs[1].price > recentHighs[0].price &&
    recentLows[1].price > recentLows[0].price
  ) return "bullish";
  if (
    recentHighs[1].price < recentHighs[0].price &&
    recentLows[1].price < recentLows[0].price
  ) return "bearish";
  return "neutral";
}

function makeConcept(
  kind: TradingConcept["kind"],
  direction: Direction,
  evidence: string,
  low?: number,
  high?: number,
): TradingConcept {
  return { kind, direction, evidence, low: low ?? null, high: high ?? null };
}

function detectFvg(candles: TradingCandle[], atr: number): Zone | null {
  const start = Math.max(2, candles.length - 12);
  for (let index = candles.length - 1; index >= start; index -= 1) {
    const first = candles[index - 2];
    const middle = candles[index - 1];
    const third = candles[index];
    const middleBody = Math.abs(middle.close - middle.open);
    if (middleBody < atr * 0.45) continue;
    if (third.low > first.high) return { low: first.high, high: third.low, index };
    if (third.high < first.low) return { low: third.high, high: first.low, index };
  }
  return null;
}

function analyzeTimeframe(
  timeframe: TradingTimeframe,
  candles: TradingCandle[] | undefined,
  now: number,
  schedule: TradingAnalysisResponse["marketSchedule"],
): TimeframeState {
  const data = candles ?? [];
  if (data.length) validateCandles(timeframe, data);
  const latest = data.at(-1);
  const staleAfter = TIMEFRAME_MS[timeframe] * (schedule === "continuous_24_7" ? 2 : 2.5);
  const isStale = Boolean(latest && now - latest.timestamp > staleAfter);
  if (data.length < MIN_CANDLES) {
    return {
      candles: data,
      analysis: {
        timeframe,
        dataStatus: data.length ? "insufficient" : "missing",
        bias: data.length ? "neutral" : "unavailable",
        structure: data.length
          ? `Need at least ${MIN_CANDLES} ordered candles; received ${data.length}.`
          : "No user-supplied candles were provided for this timeframe.",
        concepts: [],
        indicators: null,
      },
      atr: 0,
      swingHighs: [],
      swingLows: [],
      orderBlock: null,
      fvg: null,
      crtDirection: null,
      sweepDirection: null,
    };
  }

  const closes = data.map((candle) => candle.close);
  const atr = averageTrueRange(data);
  const highs = findPivots(data, "high");
  const lows = findPivots(data, "low");
  const trend = trendFromPivots(highs, lows);
  const last = data[data.length - 1];
  const lastHigh = highs.at(-1);
  const lastLow = lows.at(-1);
  const concepts: TradingConcept[] = [];
  let bias: Direction = trend;
  let sweepDirection: Direction | null = null;

  if (lastHigh && last.close > lastHigh.price) {
    const direction = "bullish";
    concepts.push(makeConcept(
      trend === "bearish" ? "CHOCH" : "BOS",
      direction,
      `Close ${last.close} finished above prior confirmed swing high ${lastHigh.price}.`,
      lastHigh.price,
      last.close,
    ));
    bias = direction;
  } else if (lastLow && last.close < lastLow.price) {
    const direction = "bearish";
    concepts.push(makeConcept(
      trend === "bullish" ? "CHOCH" : "BOS",
      direction,
      `Close ${last.close} finished below prior confirmed swing low ${lastLow.price}.`,
      last.close,
      lastLow.price,
    ));
    bias = direction;
  }

  if (trend === "bullish") {
    concepts.push(makeConcept("HH_HL", trend, "The last two confirmed swing highs and lows both advanced."));
  } else if (trend === "bearish") {
    concepts.push(makeConcept("LH_LL", trend, "The last two confirmed swing highs and lows both declined."));
  }

  const tolerance = Math.max(atr * 0.12, Math.abs(last.close) * 0.00015);
  for (const [kind, pivots] of [["EQUAL_HIGHS", highs], ["EQUAL_LOWS", lows]] as const) {
    const recent = pivots.slice(-6);
    for (let index = recent.length - 1; index > 0; index -= 1) {
      const current = recent[index];
      const prior = recent.slice(0, index).find((pivot) => Math.abs(pivot.price - current.price) <= tolerance);
      if (!prior) continue;
      const level = (prior.price + current.price) / 2;
      concepts.push(makeConcept(
        kind,
        "neutral",
        `Two confirmed swing points at ${prior.price} and ${current.price} are within ${tolerance.toFixed(5)}.`,
        level - tolerance,
        level + tolerance,
      ));
      break;
    }
  }

  if (lastHigh && last.high > lastHigh.price && last.close < lastHigh.price) {
    sweepDirection = "bearish";
    concepts.push(makeConcept(
      "LIQUIDITY_SWEEP",
      "bearish",
      `The latest high ${last.high} ran above swing liquidity ${lastHigh.price}, then closed back below it at ${last.close}.`,
      lastHigh.price,
      last.high,
    ));
    if (concepts.some((concept) => concept.kind === "EQUAL_HIGHS")) {
      concepts.push(makeConcept(
        "INDUCEMENT",
        "bearish",
        "The equal-high liquidity cluster was swept and rejected by the same candle.",
        lastHigh.price,
        last.high,
      ));
    }
  } else if (lastLow && last.low < lastLow.price && last.close > lastLow.price) {
    sweepDirection = "bullish";
    concepts.push(makeConcept(
      "LIQUIDITY_SWEEP",
      "bullish",
      `The latest low ${last.low} ran below swing liquidity ${lastLow.price}, then closed back above it at ${last.close}.`,
      last.low,
      lastLow.price,
    ));
    if (concepts.some((concept) => concept.kind === "EQUAL_LOWS")) {
      concepts.push(makeConcept(
        "INDUCEMENT",
        "bullish",
        "The equal-low liquidity cluster was swept and reclaimed by the same candle.",
        last.low,
        lastLow.price,
      ));
    }
  }

  const displacement = Math.abs(last.close - last.open) >= atr * 1.25;
  if (displacement) {
    concepts.push(makeConcept(
      "DISPLACEMENT",
      last.close >= last.open ? "bullish" : "bearish",
      `Latest candle body ${Math.abs(last.close - last.open).toFixed(5)} is at least 1.25 ATR (${atr.toFixed(5)}).`,
      Math.min(last.open, last.close),
      Math.max(last.open, last.close),
    ));
  }

  let orderBlock: Zone | null = null;
  const structuralBreak = concepts.find((concept) => concept.kind === "BOS" || concept.kind === "CHOCH");
  if (structuralBreak && displacement) {
    for (let index = data.length - 2; index >= Math.max(0, data.length - 8); index -= 1) {
      const candle = data[index];
      const isOpposite = structuralBreak.direction === "bullish"
        ? candle.close < candle.open
        : candle.close > candle.open;
      if (!isOpposite) continue;
      orderBlock = { low: candle.low, high: candle.high, index };
      concepts.push(makeConcept(
        "ORDER_BLOCK",
        structuralBreak.direction,
        `Last opposing candle at ${new Date(candle.timestamp).toISOString()} preceded a ${structuralBreak.kind} and displacement.`,
        candle.low,
        candle.high,
      ));
      concepts.push(makeConcept(
        "SUPPLY_DEMAND",
        structuralBreak.direction,
        `Zone is defined by that opposing candle (${candle.low}–${candle.high}) before the confirmed break.`,
        candle.low,
        candle.high,
      ));
      break;
    }
  }

  const fvg = detectFvg(data, atr);
  if (fvg) {
    const first = data[fvg.index - 2];
    const third = data[fvg.index];
    const direction = third.low > first.high ? "bullish" : "bearish";
    concepts.push(makeConcept(
      "FAIR_VALUE_GAP",
      direction,
      `Three-candle gap remains between ${fvg.low} and ${fvg.high}; its middle candle body exceeded 0.45 ATR.`,
      fvg.low,
      fvg.high,
    ));
  }

  const prior = data[data.length - 2];
  let crtDirection: Direction | null = null;
  if (last.low < prior.low && last.close > prior.low && last.close < prior.high) {
    crtDirection = "bullish";
  } else if (last.high > prior.high && last.close < prior.high && last.close > prior.low) {
    crtDirection = "bearish";
  }
  if (crtDirection) {
    concepts.push(makeConcept(
      timeframe === "30M" ? "CRT_INTRADAY" : timeframe === "1D" ? "CRT_SWING" : "CRT_INTRADAY",
      crtDirection,
      `Latest candle swept the prior candle range (${prior.low}–${prior.high}) and closed back inside it at ${last.close}.`,
      prior.low,
      prior.high,
    ));
  }

  const range = data.slice(-20);
  const rangeHigh = Math.max(...range.map((candle) => candle.high));
  const rangeLow = Math.min(...range.map((candle) => candle.low));
  const midpoint = (rangeHigh + rangeLow) / 2;
  concepts.push(makeConcept(
    "PREMIUM_DISCOUNT",
    last.close >= midpoint ? "bearish" : "bullish",
    `Price ${last.close} is ${last.close >= midpoint ? "above" : "below"} the 20-candle range midpoint ${midpoint}.`,
    rangeLow,
    rangeHigh,
  ));

  const nearestSupport = lows.at(-1);
  const nearestResistance = highs.at(-1);
  if (nearestSupport || nearestResistance) {
    concepts.push(makeConcept(
      "SUPPORT_RESISTANCE",
      "neutral",
      `Nearest confirmed swing reference: ${nearestSupport ? `support ${nearestSupport.price}` : ""}${nearestSupport && nearestResistance ? "; " : ""}${nearestResistance ? `resistance ${nearestResistance.price}` : ""}.`,
      nearestSupport?.price,
      nearestResistance?.price,
    ));
  }

  const indicators: TradingIndicators = {
    atr14: atr,
    ema20: ema(closes.slice(-Math.min(20, closes.length)), Math.min(20, closes.length)),
    ema50: ema(closes, Math.min(50, closes.length)),
    rsi14: rsi(closes),
  };
  const indicatorDirection = indicators.ema20 > indicators.ema50
    ? "bullish"
    : indicators.ema20 < indicators.ema50
      ? "bearish"
      : "neutral";
  if (bias === "neutral" && indicatorDirection !== "neutral") bias = indicatorDirection;
  if (isStale) {
    concepts.push(makeConcept(
      "SUPPORT_RESISTANCE",
      "neutral",
      `Data is stale: the latest ${timeframe} candle is older than ${(staleAfter / 60_000).toFixed(0)} minutes.`,
    ));
  }

  const structure = trend === "bullish"
    ? "Higher highs and higher lows"
    : trend === "bearish"
      ? "Lower highs and lower lows"
      : concepts.some((concept) => concept.kind === "BOS" || concept.kind === "CHOCH")
        ? `Structural break detected (${concepts.find((concept) => concept.kind === "BOS" || concept.kind === "CHOCH")?.kind})`
        : "Range / structure not confirmed";
  return {
    candles: data,
    analysis: {
      timeframe,
      dataStatus: isStale ? "stale" : "available",
      bias,
      structure,
      concepts,
      indicators,
    },
    atr,
    swingHighs: highs,
    swingLows: lows,
    orderBlock,
    fvg,
    crtDirection,
    sweepDirection,
  };
}

function noTradeSignal(
  status: TradingSignal["status"],
  explanation: string,
  evidence: string[] = [],
  confidence = 0,
): TradingSignal {
  return {
    decision: "NO_TRADE",
    status,
    setupTimeframe: "30M",
    entryPrice: null,
    entryLow: null,
    entryHigh: null,
    stopLoss: null,
    targets: [],
    confidence,
    confidenceExplanation: explanation,
    evidence,
    invalidationConditions: [
      "Re-analyze with a new ordered candle set after the conditions change.",
      "This response is not an execution instruction.",
    ],
    expiresAt: null,
  };
}

export function analyzeTrading(
  input: TradingAnalysisInput,
  now = Date.now(),
): TradingAnalysisResponse {
  const symbol = normalizeSymbol(input.symbol);
  const states = new Map<TradingTimeframe, TimeframeState>();
  for (const timeframe of TIMEFRAMES) {
    states.set(
      timeframe,
      analyzeTimeframe(timeframe, input.timeframes[timeframe], now, symbol.marketSchedule),
    );
  }

  const analyses = TIMEFRAMES.map((timeframe) => states.get(timeframe)!.analysis);
  const supplied = TIMEFRAMES
    .map((timeframe) => states.get(timeframe)!)
    .filter((state) => state.candles.length > 0);
  const lastCandle = supplied
    .map((state) => state.candles.at(-1)!)
    .sort((left, right) => right.timestamp - left.timestamp)[0];
  const last30 = states.get("30M")!;
  const lastTimestamp = lastCandle?.timestamp ?? null;
  const anyStale = analyses.some((analysis) => analysis.dataStatus === "stale");
  const anyInsufficient = analyses.some((analysis) =>
    analysis.dataStatus === "missing" || analysis.dataStatus === "insufficient",
  );
  const marketFreshness = supplied.length === 0
    ? "unavailable"
    : anyStale
      ? "stale"
      : "fresh";
  const dailyBias = states.get("1D")!.analysis.bias;
  const fourHourBias = states.get("4H")!.analysis.bias;
  const oneHourBias = states.get("1H")!.analysis.bias;
  const thirtyBias = states.get("30M")!.analysis.bias;
  const conflicts: string[] = [];
  if (
    dailyBias !== "unavailable" &&
    fourHourBias !== "unavailable" &&
    dailyBias !== "neutral" &&
    fourHourBias !== "neutral" &&
    dailyBias !== fourHourBias
  ) {
    conflicts.push(`Daily bias is ${dailyBias}; 4H structure is ${fourHourBias}. Lower timeframes do not override this higher-timeframe conflict.`);
  }
  if (
    fourHourBias !== "unavailable" &&
    oneHourBias !== "unavailable" &&
    fourHourBias !== "neutral" &&
    oneHourBias !== "neutral" &&
    fourHourBias !== oneHourBias
  ) {
    conflicts.push(`4H bias is ${fourHourBias}; 1H confirmation is ${oneHourBias}.`);
  }
  if (
    oneHourBias !== "unavailable" &&
    thirtyBias !== "unavailable" &&
    oneHourBias !== "neutral" &&
    thirtyBias !== "neutral" &&
    oneHourBias !== thirtyBias
  ) {
    conflicts.push(`1H bias is ${oneHourBias}; 30M setup structure is ${thirtyBias}.`);
  }
  const higherTimeframeBias: TradingBias =
    dailyBias === "unavailable" || fourHourBias === "unavailable"
      ? "unavailable"
      : dailyBias === fourHourBias
        ? dailyBias
        : "neutral";

  let signal: TradingSignal;
  if (symbol.instrumentClass === "unsupported") {
    signal = noTradeSignal("unavailable", "Symbol could not be safely normalized to a supported instrument. No analysis was generated.");
  } else if (supplied.length === 0) {
    signal = noTradeSignal("unavailable", "No market candles were provided. A connected live or delayed data provider is not configured.");
  } else if (anyInsufficient) {
    const incomplete = analyses
      .filter((analysis) => analysis.dataStatus === "missing" || analysis.dataStatus === "insufficient")
      .map((analysis) => `${analysis.timeframe}: ${analysis.structure}`);
    signal = noTradeSignal("unavailable", "NO TRADE: all four timeframes need at least 20 valid candles for top-down analysis.", incomplete);
  } else if (anyStale) {
    signal = noTradeSignal("stale", "NO TRADE: one or more supplied timeframes are stale; refresh the historical candle files before evaluating a setup.", conflicts);
  } else if (conflicts.length > 0) {
    signal = noTradeSignal("valid", "NO TRADE: timeframe structure conflicts. Higher-timeframe direction is not overridden by a lower-timeframe trigger.", conflicts, 35);
  } else if (
    higherTimeframeBias === "unavailable" ||
    higherTimeframeBias === "neutral" ||
    oneHourBias !== higherTimeframeBias ||
    thirtyBias !== higherTimeframeBias
  ) {
    signal = noTradeSignal(
      "valid",
      "NO TRADE: Daily, 4H, 1H, and 30M directional alignment is not confirmed.",
      analyses.map((analysis) => `${analysis.timeframe}: ${analysis.bias} — ${analysis.structure}`),
      30,
    );
  } else {
    const direction = higherTimeframeBias === "bullish" ? "bullish" : "bearish";
    const trigger = last30.sweepDirection === direction || last30.crtDirection === direction;
    if (!trigger) {
      signal = noTradeSignal(
        "valid",
        "NO TRADE: directional alignment exists, but 30M has no evidenced liquidity sweep or CRT reclaim trigger.",
        [`30M bias is ${thirtyBias}.`, "No eligible 30M sweep or range reclaim was detected."],
        50,
      );
    } else {
      const latest = last30.candles.at(-1)!;
      const recent = last30.candles.slice(-6);
      const stopBuffer = last30.atr * 0.15;
      const stopLoss = direction === "bullish"
        ? Math.min(...recent.map((candle) => candle.low)) - stopBuffer
        : Math.max(...recent.map((candle) => candle.high)) + stopBuffer;
      const risk = Math.abs(latest.close - stopLoss);
      const volatilityTooHigh = last30.atr > 0 && risk > last30.atr * 2.5;
      const riskPositive = risk > 0 && Number.isFinite(risk);
      const expiry = latest.timestamp + TIMEFRAME_MS["30M"] * 2;
      const expired = now > expiry;
      const stopAlreadyCrossed = direction === "bullish"
        ? latest.close <= stopLoss
        : latest.close >= stopLoss;
      if (!riskPositive || volatilityTooHigh || stopAlreadyCrossed) {
        signal = noTradeSignal(
          "valid",
          volatilityTooHigh
            ? "NO TRADE: the required stop distance exceeds 2.5 times 30M ATR, so current volatility makes the setup unsuitable."
            : "NO TRADE: the entry and invalidation levels do not produce a valid positive-risk setup.",
          [`Entry close ${latest.close}; stop ${stopLoss}; 30M ATR ${last30.atr}.`],
          45,
        );
      } else if (expired || anyStale) {
        signal = noTradeSignal(
          expired ? "expired" : "stale",
          expired
            ? "NO TRADE: the 30M setup window expired two candles after its source candle."
            : "NO TRADE: source candles are stale.",
          [`Source candle time: ${new Date(latest.timestamp).toISOString()}.`],
        );
      } else {
        const sign = direction === "bullish" ? 1 : -1;
        const confidence = Math.min(
          95,
          35 +
            (dailyBias === fourHourBias ? 15 : 0) +
            (oneHourBias === higherTimeframeBias ? 10 : 0) +
            (thirtyBias === higherTimeframeBias ? 10 : 0) +
            15 +
            (last30.orderBlock || last30.fvg ? 10 : 0),
        );
        const riskMultiples = [1.5, 2, 3];
        const targets: TradingSignal["targets"] = riskMultiples.map((multiple, index) => ({
          label: `TP${index + 1}` as "TP1" | "TP2" | "TP3",
          price: latest.close + sign * risk * multiple,
          riskReward: multiple,
        }));
        const relevantZone = last30.orderBlock ?? last30.fvg;
        const evidence = [
          `Daily and 4H bias are ${higherTimeframeBias}.`,
          `1H and 30M structure both align ${direction}.`,
          ...last30.analysis.concepts
            .filter((concept) =>
              concept.kind === "LIQUIDITY_SWEEP" ||
              concept.kind === "CRT_INTRADAY" ||
              concept.kind === "ORDER_BLOCK" ||
              concept.kind === "FAIR_VALUE_GAP" ||
              concept.kind === "CHOCH",
            )
            .map((concept) => `${concept.kind}: ${concept.evidence}`),
        ];
        signal = {
          decision: direction === "bullish" ? "BUY" : "SELL",
          status: "valid",
          setupTimeframe: "30M",
          entryPrice: latest.close,
          entryLow: relevantZone?.low ?? latest.close,
          entryHigh: relevantZone?.high ?? latest.close,
          stopLoss,
          targets,
          confidence,
          confidenceExplanation: `${confidence}/100 confluence score from aligned structure and a confirmed 30M trigger. This is not a probability of profit.`,
          evidence,
          invalidationConditions: [
            `${direction === "bullish" ? "A 30M close" : "A 30M close"} beyond stop ${stopLoss} invalidates the setup.`,
            `Daily or 4H structure changing to the opposite bias invalidates the directional thesis.`,
            "Reassess after a material candle update; do not treat this as an execution instruction.",
          ],
          expiresAt: expiry,
        };
      }
    }
  }

  const allCandles = supplied.flatMap((state) => state.candles);
  return {
    requestedSymbol: input.symbol,
    canonicalSymbol: symbol.canonical,
    instrumentClass: symbol.instrumentClass,
    marketSchedule: symbol.marketSchedule,
    dataSource: supplied.length ? "user_supplied_historical" : "unavailable",
    analysisTimestamp: now,
    lastMarketTimestamp: lastTimestamp,
    marketFreshness,
    currentPrice: last30.candles.at(-1)?.close ?? allCandles.at(-1)?.close ?? null,
    higherTimeframeBias,
    conflicts,
    timeframes: analyses,
    signal,
    macroContext: {
      status: "unavailable",
      supportedEvents: ["CPI", "PPI", "NFP", "FOMC"],
      excludedEvent: "PCE",
      hypothesisPercent: null,
      explanation: "No reliable news/calendar source is connected. No macro bias is inferred; any future event bias must be a sourced hypothesis, not a prediction.",
    },
  };
}
