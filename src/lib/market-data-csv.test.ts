import { describe, expect, it } from "vitest";
import { parseMarketCandlesCsv } from "./market-data-csv";

describe("parseMarketCandlesCsv", () => {
  it("parses broker OHLC exports with Unix-second timestamps and volume", () => {
    const result = parseMarketCandlesCsv(
      "Timestamp,Open,High,Low,Close,Volume\n1700000000,100,103,99,102,42\n1700001800,102,104,101,103,54",
    );
    expect(result.candles).toEqual([
      { timestamp: 1_700_000_000_000, open: 100, high: 103, low: 99, close: 102, volume: 42 },
      { timestamp: 1_700_001_800_000, open: 102, high: 104, low: 101, close: 103, volume: 54 },
    ]);
  });

  it("accepts split Date and Time columns and warns on too few candles", () => {
    const result = parseMarketCandlesCsv(
      "Date,Time,Open,High,Low,Close\n2026-01-01,12:00:00,100,103,99,102",
    );
    expect(result.candles[0].timestamp).toBe(Date.parse("2026-01-01T12:00:00"));
    expect(result.warnings).toContain("At least 50 closed candles are required for structural analysis.");
  });

  it.each([
    ["missing a required price column", "timestamp,open,high,low\n1,1,2,0.5"],
    ["non-numeric price values", "timestamp,open,high,low,close\n1,1,no,0.5,1"],
    ["invalid OHLC order", "timestamp,open,high,low,close\n1,4,3,2,2.5"],
    ["unordered timestamps", "timestamp,open,high,low,close\n2,1,2,0.5,1.5\n1,1,2,0.5,1.5"],
  ])("rejects CSV %s", (_reason, csv) => {
    expect(() => parseMarketCandlesCsv(csv)).toThrow();
  });
});
