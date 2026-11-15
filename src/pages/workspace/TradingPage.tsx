import { useState } from "react";
import { useAnalyzeTrading } from "@workspace/api-client-react";
import type {
  TradingAnalysisInputTimeframes,
  TradingAnalysisResponse,
  TradingTimeframe,
} from "@workspace/api-client-react";
import { AlertTriangle, FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { parseMarketCandlesCsv } from "../../lib/market-data-csv";

const TIMEFRAMES: TradingTimeframe[] = ["1D", "4H", "1H", "30M"];
const TIMEFRAME_DESCRIPTIONS: Record<TradingTimeframe, string> = {
  "1D": "Overall directional bias and major structure",
  "4H": "Intermediate structure, zones, and liquidity",
  "1H": "Directional confirmation and developing setup",
  "30M": "Entry trigger, stop, and invalidation",
};

interface ImportedTimeframe {
  fileName: string;
  candles: NonNullable<TradingAnalysisInputTimeframes["30M"]>;
  warnings: string[];
}

function formatPrice(value: number | null | undefined): string {
  return value == null
    ? "—"
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(value);
}

function formatDate(timestamp: number | null | undefined): string {
  if (timestamp == null) return "Unavailable";
  return new Date(timestamp).toLocaleString();
}

function biasColor(bias: string): string {
  if (bias === "bullish") return "text-[#16A36A]";
  if (bias === "bearish") return "text-[#E05252]";
  if (bias === "neutral") return "text-[#E69A36]";
  return "text-[#A9BEB5]";
}

function AnalysisResults({ analysis }: { analysis: TradingAnalysisResponse }) {
  const signal = analysis.signal;
  const decisionColor = signal.decision === "BUY"
    ? "text-[#16A36A] border-[#16A36A]/40 bg-[#16A36A]/10"
    : signal.decision === "SELL"
      ? "text-[#E05252] border-[#E05252]/40 bg-[#E05252]/10"
      : "text-[#E69A36] border-[#E69A36]/40 bg-[#E69A36]/10";

  return (
    <div className="space-y-4" data-testid="trading-analysis-results">
      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#168BFF]">Imported candle analysis</p>
            <h2 className="mt-1 text-lg font-bold text-[#E8F2EE]">
              {analysis.requestedSymbol}
              {analysis.canonicalSymbol && analysis.canonicalSymbol !== analysis.requestedSymbol.toUpperCase()
                ? <span className="ml-2 text-sm font-medium text-[#A9BEB5]">→ {analysis.canonicalSymbol}</span>
                : null}
            </h2>
            <p className="mt-1 text-xs text-[#A9BEB5]">
              {analysis.instrumentClass} · {analysis.marketSchedule.replaceAll("_", " ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-mono font-bold text-[#168BFF]">{formatPrice(analysis.currentPrice)}</p>
            <p className="text-[10px] text-[#A9BEB5]">latest imported close · {formatDate(analysis.lastMarketTimestamp)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-full border border-[#168BFF]/30 bg-[#168BFF]/10 px-2.5 py-1 text-[#168BFF]">
            User-supplied historical data
          </span>
          <span className={`rounded-full border px-2.5 py-1 ${analysis.marketFreshness === "fresh"
            ? "border-[#16A36A]/30 bg-[#16A36A]/10 text-[#16A36A]"
            : "border-[#E69A36]/30 bg-[#E69A36]/10 text-[#E69A36]"}`}>
            Data {analysis.marketFreshness}
          </span>
          <span className="rounded-full border border-[#1A363E] px-2.5 py-1 text-[#A9BEB5]">
            Analysis {formatDate(analysis.analysisTimestamp)}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#E8F2EE]">Top-down structure</h3>
          <span className={`text-xs font-mono font-bold uppercase ${biasColor(analysis.higherTimeframeBias)}`}>
            Higher-timeframe bias: {analysis.higherTimeframeBias}
          </span>
        </div>
        {analysis.conflicts.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#E69A36]/30 bg-[#E69A36]/10 p-3 text-xs text-[#E8B75A]" data-testid="status-timeframe-conflict">
            <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Timeframe conflict</div>
            {analysis.conflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {analysis.timeframes.map((timeframe) => (
            <article key={timeframe.timeframe} className="rounded-xl border border-[#1A363E] bg-[#101B20] p-3" data-testid={`card-timeframe-${timeframe.timeframe}`}>
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-mono text-sm font-bold text-[#E8F2EE]">{timeframe.timeframe}</h4>
                <span className={`text-[10px] font-bold uppercase ${biasColor(timeframe.bias)}`}>{timeframe.bias}</span>
              </div>
              <p className="mt-1 text-[10px] text-[#A9BEB5]">{TIMEFRAME_DESCRIPTIONS[timeframe.timeframe]}</p>
              <p className="mt-2 text-xs text-[#E8F2EE]">{timeframe.structure}</p>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] uppercase ${
                timeframe.dataStatus === "available"
                  ? "border-[#16A36A]/30 text-[#16A36A]"
                  : "border-[#E69A36]/30 text-[#E69A36]"
              }`}>{timeframe.dataStatus} data</span>
              {timeframe.indicators && (
                <p className="mt-2 text-[10px] font-mono text-[#168BFF]">
                  ATR {formatPrice(timeframe.indicators.atr14)} · RSI {timeframe.indicators.rsi14.toFixed(1)} · EMA20/50 {formatPrice(timeframe.indicators.ema20)}/{formatPrice(timeframe.indicators.ema50)}
                </p>
              )}
              {timeframe.concepts.length > 0 && (
                <ul className="mt-2 space-y-1.5 border-t border-[#1A363E] pt-2">
                  {timeframe.concepts.map((concept, index) => (
                    <li key={`${concept.kind}-${index}`} className="text-[10px] leading-relaxed text-[#A9BEB5]">
                      <span className="font-bold text-[#E8F2EE]">{concept.kind.replaceAll("_", " ")}</span>
                      {concept.low != null && concept.high != null && (
                        <span className="ml-1 font-mono text-[#168BFF]">{formatPrice(concept.low)}–{formatPrice(concept.high)}</span>
                      )}
                      <span className="block">{concept.evidence}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4" data-testid="card-trading-signal">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#A9BEB5]">30M setup · manual review only</p>
            <span className={`mt-1 inline-flex rounded-lg border px-3 py-1 text-sm font-extrabold ${decisionColor}`} data-testid="status-trading-decision">
              {signal.decision}
            </span>
          </div>
          <span className="text-[10px] uppercase text-[#A9BEB5]">Signal state: {signal.status}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#A9BEB5]">{signal.confidenceExplanation}</p>
        {signal.decision !== "NO_TRADE" && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg bg-[#101B20] p-2">
                <span className="block text-[9px] text-[#A9BEB5]">Entry</span>
                <strong className="font-mono text-xs text-[#E8F2EE]">{formatPrice(signal.entryPrice)}</strong>
                {signal.entryLow !== signal.entryHigh && <span className="block text-[9px] text-[#A9BEB5]">{formatPrice(signal.entryLow)}–{formatPrice(signal.entryHigh)}</span>}
              </div>
              <div className="rounded-lg bg-[#101B20] p-2">
                <span className="block text-[9px] text-[#E05252]">Stop-loss</span>
                <strong className="font-mono text-xs text-[#E8F2EE]">{formatPrice(signal.stopLoss)}</strong>
              </div>
              {signal.targets.map((target) => (
                <div key={target.label} className="rounded-lg bg-[#101B20] p-2">
                  <span className="block text-[9px] text-[#16A36A]">{target.label} · {target.riskReward}:1 R:R</span>
                  <strong className="font-mono text-xs text-[#E8F2EE]">{formatPrice(target.price)}</strong>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[#A9BEB5]">Stop is beyond the recent 30M range with an ATR buffer. Targets are calculated risk multiples, not price forecasts.</p>
            <p className="mt-1 text-[10px] text-[#A9BEB5]">Expires: {formatDate(signal.expiresAt)}</p>
          </>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <h4 className="text-[10px] font-bold uppercase text-[#A9BEB5]">Evidence</h4>
            <ul className="mt-1 space-y-1 text-[10px] text-[#E8F2EE]">
              {signal.evidence.length ? signal.evidence.map((item) => <li key={item}>• {item}</li>) : <li>No confirmed setup evidence.</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase text-[#A9BEB5]">Invalidation / review</h4>
            <ul className="mt-1 space-y-1 text-[10px] text-[#E8F2EE]">
              {signal.invalidationConditions.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 border-t border-[#1A363E] pt-3 text-[10px] text-[#A9BEB5]">
          <ShieldCheck className="size-4 shrink-0 text-[#16A36A]" />
          No orders are placed. This analysis is informational and does not promise profitability.
        </p>
      </section>

      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4">
        <h3 className="text-sm font-bold text-[#E8F2EE]">News & macro context</h3>
        <p className="mt-1 text-xs text-[#A9BEB5]">{analysis.macroContext.explanation}</p>
        <p className="mt-2 text-[10px] font-mono text-[#168BFF]">
          Monitored when a reliable feed is connected: {analysis.macroContext.supportedEvents.join(" · ")}. PCE excluded.
        </p>
      </section>
    </div>
  );
}

export const TradingPage = () => {
  const { session } = useAuth();
  const [symbol, setSymbol] = useState("XAUUSD");
  const [imports, setImports] = useState<Partial<Record<TradingTimeframe, ImportedTimeframe>>>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TradingAnalysisResponse | null>(null);
  const analyze = useAnalyzeTrading({
    request: session?.access_token
      ? { headers: { Authorization: `Bearer ${session.access_token}` } }
      : undefined,
  });

  const handleFile = async (timeframe: TradingTimeframe, file?: File) => {
    setImportError(null);
    setAnalysis(null);
    if (!file) {
      setImports((current) => {
        const next = { ...current };
        delete next[timeframe];
        return next;
      });
      return;
    }
    try {
      const parsed = parseMarketCandlesCsv(await file.text());
      setImports((current) => ({
        ...current,
        [timeframe]: { fileName: file.name, ...parsed },
      }));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "This CSV could not be read.");
      setImports((current) => {
        const next = { ...current };
        delete next[timeframe];
        return next;
      });
    }
  };

  const submitAnalysis = () => {
    const timeframes: TradingAnalysisInputTimeframes = {};
    for (const timeframe of TIMEFRAMES) {
      const file = imports[timeframe];
      if (file) timeframes[timeframe] = file.candles;
    }
    setAnalysis(null);
    analyze.mutate({ data: { symbol: symbol.trim(), timeframes } }, {
      onSuccess: (result) => setAnalysis(result),
    });
  };

  const complete = TIMEFRAMES.every((timeframe) =>
    (imports[timeframe]?.candles.length ?? 0) >= 20,
  );

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#168BFF]">Trading intelligence · structural analysis</p>
            <h1 className="mt-1 text-xl font-extrabold text-[#E8F2EE]">Multi-timeframe market review</h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#A9BEB5]">
              Import your broker’s candle exports for 30M, 1H, 4H, and 1D. Analysis uses only those supplied historical bars; no live or delayed market feed is connected.
            </p>
          </div>
          <span className="rounded-full border border-[#E69A36]/30 bg-[#E69A36]/10 px-3 py-1.5 text-[10px] font-bold uppercase text-[#E69A36]">
            Data provider unavailable
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(180px,0.7fr)_2fr]">
          <label className="block text-xs font-semibold text-[#E8F2EE]">
            Broker symbol
            <input
              type="text"
              value={symbol}
              onChange={(event) => {
                setSymbol(event.target.value);
                setAnalysis(null);
              }}
              placeholder="e.g. XAUUSDm, BTCUSD.a, US30.cash"
              data-testid="input-trading-symbol"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#1A363E] bg-[#101B20] px-3 font-mono text-sm text-[#E8F2EE] outline-none focus:border-[#168BFF]"
            />
            <span className="mt-1 block text-[10px] font-normal text-[#A9BEB5]">
              Gold, BTC pairs, FX pairs, US30, US100 and common broker aliases
            </span>
          </label>

          <div>
            <p className="text-xs font-semibold text-[#E8F2EE]">Import OHLC CSV files</p>
            <p className="mt-1 text-[10px] text-[#A9BEB5]">Columns: timestamp/date, open, high, low, close; optional volume. Use oldest-to-newest rows. Unix seconds, milliseconds, or ISO dates are accepted.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TIMEFRAMES.map((timeframe) => {
                const imported = imports[timeframe];
                return (
                  <label key={timeframe} className="flex min-h-[88px] cursor-pointer items-center gap-3 rounded-xl border border-[#1A363E] bg-[#101B20] p-3 hover:border-[#168BFF]/50">
                    <FileUp className="size-4 shrink-0 text-[#168BFF]" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-bold text-[#E8F2EE]">{timeframe}</span>
                      <span className="block text-[9px] text-[#A9BEB5]">{TIMEFRAME_DESCRIPTIONS[timeframe]}</span>
                      <span className={`mt-1 block truncate text-[10px] ${imported ? "text-[#16A36A]" : "text-[#A9BEB5]"}`}>
                        {imported ? `${imported.candles.length} candles · ${imported.fileName}` : "Choose CSV file"}
                      </span>
                      {imported?.warnings.map((warning) => <span key={warning} className="mt-1 block text-[9px] text-[#E69A36]">{warning}</span>)}
                    </span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      aria-label={`Import ${timeframe} candles CSV`}
                      data-testid={`input-market-csv-${timeframe}`}
                      onChange={(event) => void handleFile(timeframe, event.target.files?.[0])}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {importError && <p role="alert" data-testid="error-market-csv" className="mt-3 rounded-lg border border-[#E05252]/30 bg-[#E05252]/10 p-3 text-xs text-[#FF9696]">{importError}</p>}
        {analyze.isError && <p role="alert" className="mt-3 rounded-lg border border-[#E05252]/30 bg-[#E05252]/10 p-3 text-xs text-[#FF9696]">{analyze.error instanceof Error ? analyze.error.message : "Analysis request failed. Please try again."}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submitAnalysis}
            disabled={!symbol.trim() || analyze.isPending}
            data-testid="button-analyze-market"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#16A36A] px-4 text-xs font-bold text-[#E8F2EE] transition-colors hover:bg-[#148f5d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyze.isPending && <LoaderCircle className="size-4 animate-spin" />}
            {analyze.isPending ? "Analyzing candles…" : "Analyze supplied data"}
          </button>
          <span className="text-[10px] text-[#A9BEB5]">
            {complete ? "All four timeframes are loaded." : "Missing or short timeframes return NO TRADE; analysis remains explicit."}
          </span>
        </div>
      </section>

      {analysis && <AnalysisResults analysis={analysis} />}
    </div>
  );
};
