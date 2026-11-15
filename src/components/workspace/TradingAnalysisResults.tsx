import type { TradingAnalysisResponse, TradingTimeframe } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export const TIMEFRAME_DESCRIPTIONS: Record<TradingTimeframe, string> = {
  "1D": "Overall directional bias and major structure",
  "4H": "Intermediate structure, zones, and liquidity",
  "1H": "Directional confirmation and developing setup",
  "30M": "Entry trigger, stop, and invalidation",
};

function formatPrice(value: number | null | undefined): string {
  return value == null
    ? "Unavailable"
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

export function TradingAnalysisResults({ analysis }: { analysis: TradingAnalysisResponse }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, [analysis]);
  const reviewExpired = analysis.signal.expiresAt != null && now > analysis.signal.expiresAt;
  const dataIncomplete = analysis.dataSource !== "user_supplied_historical"
    || analysis.timeframes.some((tf) => tf.dataStatus !== "available");
  const signal = (dataIncomplete || reviewExpired) && analysis.signal.decision !== "NO_TRADE"
    ? {
      ...analysis.signal,
      decision: "NO_TRADE" as const,
      status: reviewExpired ? "expired" as const : "unavailable" as const,
      confidence: 0,
      confidenceExplanation: reviewExpired
        ? "NO TRADE: the review window has expired. Import refreshed closed candles and run analysis again."
        : "NO TRADE: source data is unavailable, insufficient, or stale.",
      targets: [], entryPrice: null, entryLow: null, entryHigh: null, stopLoss: null,
    }
    : analysis.signal;
  const decisionColor = signal.decision === "BUY"
    ? "text-[#16A36A] border-[#16A36A]/40 bg-[#16A36A]/10"
    : signal.decision === "SELL"
      ? "text-[#E05252] border-[#E05252]/40 bg-[#E05252]/10"
      : "text-[#E69A36] border-[#E69A36]/40 bg-[#E69A36]/10";

  return (
    <div className="space-y-4" data-testid="trading-analysis-results" aria-live="polite">
      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#168BFF]">Imported candle analysis</p>
            <h2 className="mt-1 text-lg font-bold text-[#E8F2EE]">
              {analysis.requestedSymbol}
              {analysis.canonicalSymbol && analysis.canonicalSymbol !== analysis.requestedSymbol.toUpperCase()
                ? <span className="ml-2 text-sm font-medium text-[#A9BEB5]">mapped to {analysis.canonicalSymbol}</span>
                : null}
            </h2>
            <p className="mt-1 text-xs text-[#A9BEB5]">
              {analysis.instrumentClass} · {analysis.marketSchedule.replaceAll("_", " ")}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xl font-mono font-bold text-[#168BFF]">{formatPrice(analysis.currentPrice)}</p>
            <p className="text-[10px] text-[#A9BEB5]">latest imported close · {formatDate(analysis.lastMarketTimestamp)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-full border border-[#168BFF]/30 bg-[#168BFF]/10 px-2.5 py-1 text-[#168BFF]">
            {analysis.dataSource === "user_supplied_historical" ? "User-supplied historical data" : "Market data unavailable"}
          </span>
          <span className={`rounded-full border px-2.5 py-1 ${analysis.marketFreshness === "fresh"
            ? "border-[#16A36A]/30 bg-[#16A36A]/10 text-[#16A36A]"
            : "border-[#E69A36]/30 bg-[#E69A36]/10 text-[#E69A36]"}`}>
            Data {reviewExpired ? "needs refresh" : analysis.marketFreshness}
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
        {dataIncomplete && <p className="mt-3 rounded-lg border border-[#E69A36]/30 bg-[#E69A36]/10 p-2 text-[10px] text-[#E8B75A]" data-testid="status-data-unavailable">One or more timeframes are missing, short, or stale. No setup is shown until every timeframe has enough supplied candles.</p>}
        <p className="mt-3 text-xs text-[#A9BEB5]">Confluence score <span className="font-mono font-bold text-[#168BFF]">{signal.confidence}%</span> <span className="text-[10px]">(not a probability of profit)</span></p>
        <p className="mt-1 text-xs leading-relaxed text-[#A9BEB5]">{signal.confidenceExplanation}</p>
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
            <p className="mt-1 text-[10px] text-[#A9BEB5]">Review window ends: {formatDate(signal.expiresAt)}</p>
          </>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <h4 className="text-[10px] font-bold uppercase text-[#A9BEB5]">Evidence</h4>
            <ul className="mt-1 space-y-1 text-[10px] text-[#E8F2EE]">
              {signal.evidence.length ? signal.evidence.map((item) => <li key={item} className="list-disc ml-4">{item}</li>) : <li>No confirmed setup evidence.</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase text-[#A9BEB5]">Invalidation / review</h4>
            <ul className="mt-1 space-y-1 text-[10px] text-[#E8F2EE]">
              {signal.invalidationConditions.map((item) => <li key={item} className="list-disc ml-4">{item}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 border-t border-[#1A363E] pt-3 text-[10px] text-[#A9BEB5]">
          <ShieldCheck className="size-4 shrink-0 text-[#16A36A]" />
          No orders are placed. This analysis is informational and does not promise profitability.
        </p>
      </section>

      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-[#E8F2EE]">News and macro context</h3><span className="rounded-full border border-[#E69A36]/30 px-2.5 py-0.5 text-[10px] uppercase text-[#E69A36]">No calendar feed connected</span></div>
        <p className="mt-1 text-xs text-[#A9BEB5]">{analysis.macroContext.explanation}</p>
        <p className="mt-2 text-[10px] text-[#A9BEB5]">Without an event feed, no news blackout or percentage bias can be verified. Check economic releases independently before any decision.</p>
        <p className="mt-2 text-[10px] font-mono text-[#168BFF]">
          Would be monitored only if a reliable feed were connected: {analysis.macroContext.supportedEvents.join(" · ")}. {analysis.macroContext.excludedEvent} excluded.
        </p>
      </section>
    </div>
  );
}

