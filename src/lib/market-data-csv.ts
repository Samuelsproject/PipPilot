import type { TradingCandle } from "@workspace/api-client-react";

export interface ParsedMarketCsv {
  candles: TradingCandle[];
  warnings: string[];
}

const REQUIRED_HEADERS = ["timestamp", "open", "high", "low", "close"] as const;

function parseTimestamp(value: string, rowNumber: number): number {
  const numeric = Number(value);
  if (value.trim() !== "" && Number.isFinite(numeric)) {
    const timestamp = numeric < 1_000_000_000_000 ? numeric * 1_000 : numeric;
    if (Number.isSafeInteger(timestamp) && timestamp > 0) return timestamp;
  }
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  throw new Error(`Row ${rowNumber}: timestamp must be Unix seconds/milliseconds or an ISO date.`);
}

function parseNumber(value: string, column: string, rowNumber: number): number {
  const parsed = Number(value);
  if (!value.trim() || !Number.isFinite(parsed)) {
    throw new Error(`Row ${rowNumber}: ${column} must be a finite number.`);
  }
  return parsed;
}

export function parseMarketCandlesCsv(csv: string): ParsedMarketCsv {
  const rows = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  if (rows.length < 2) throw new Error("CSV needs a header and at least one candle row.");

  const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());
  const indices = Object.fromEntries(headers.map((header, index) => [header, index]));
  const timestampHeader = ["timestamp", "datetime"]
    .find((header) => indices[header] !== undefined);
  const hasDateAndTime = indices["date"] !== undefined && indices["time"] !== undefined;
  const singleDateTimeHeader = ["date", "time"].find((header) => indices[header] !== undefined);
  if (!timestampHeader && !hasDateAndTime && !singleDateTimeHeader) {
    throw new Error("CSV needs a timestamp, datetime, date/time, date, or time column.");
  }
  for (const header of ["open", "high", "low", "close"] as const) {
    if (indices[header] === undefined) throw new Error(`CSV is missing the ${header} column.`);
  }

  let previousTimestamp = 0;
  const candles = rows.slice(1).map((row, offset): TradingCandle => {
    const values = row.split(",").map((value) => value.trim());
    const rowNumber = offset + 2;
    const valueAt = (name: string) => values[indices[name]] ?? "";
    const candle: TradingCandle = {
      timestamp: parseTimestamp(
        timestampHeader
          ? valueAt(timestampHeader)
          : hasDateAndTime
            ? `${valueAt("date")} ${valueAt("time")}`
            : valueAt(singleDateTimeHeader!),
        rowNumber,
      ),
      open: parseNumber(valueAt("open"), "open", rowNumber),
      high: parseNumber(valueAt("high"), "high", rowNumber),
      low: parseNumber(valueAt("low"), "low", rowNumber),
      close: parseNumber(valueAt("close"), "close", rowNumber),
    };
    if (indices["volume"] !== undefined && valueAt("volume") !== "") {
      candle.volume = parseNumber(valueAt("volume"), "volume", rowNumber);
    }
    if (
      candle.open <= 0 ||
      candle.high <= 0 ||
      candle.low <= 0 ||
      candle.close <= 0 ||
      candle.high < Math.max(candle.open, candle.close, candle.low) ||
      candle.low > Math.min(candle.open, candle.close, candle.high)
    ) {
      throw new Error(`Row ${rowNumber}: OHLC values are inconsistent.`);
    }
    if (offset > 0 && candle.timestamp <= previousTimestamp) {
      throw new Error(`Row ${rowNumber}: timestamps must be strictly increasing.`);
    }
    previousTimestamp = candle.timestamp;
    return candle;
  });

  const warnings: string[] = [];
  if (candles.length > 200) {
    throw new Error(`CSV has ${candles.length} candles; the analysis accepts at most 200 per timeframe.`);
  }
  if (candles.length < 20) {
    warnings.push("At least 20 candles are required for structural analysis.");
  }
  return { candles, warnings };
}
