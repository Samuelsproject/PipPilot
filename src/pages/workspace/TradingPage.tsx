import { useEffect, useRef, useState } from "react";
import {
  useAnalyzeMarketData,
  useAnalyzeTrading,
  useGetMarketDataStatus,
} from "@workspace/api-client-react";
import type {
  MarketDataAnalysisResponse,
  TradingAnalysisInputTimeframes,
  TradingAnalysisResponse,
  TradingTimeframe,
} from "@workspace/api-client-react";
import { FileUp, LoaderCircle } from "lucide-react";
import { TradingAnalysisResults, TIMEFRAME_DESCRIPTIONS } from "../../components/workspace/TradingAnalysisResults";
import { useAuth } from "../../context/AuthContext";
import { parseMarketCandlesCsv } from "../../lib/market-data-csv";

const MIN_CANDLES = 50;
const MAX_CANDLES = 200;
const TIMEFRAMES: TradingTimeframe[] = ["1D", "4H", "1H", "30M"];
const INSTRUMENT_PRESETS = [
  "XAUUSD", "BTCUSD", "BTCUSDT", "EURUSD", "GBPUSD", "USDJPY",
  "US30", "US100", "US500", "GER40", "UK100", "JP225",
];

const CONNECTION_LABELS = {
  connected: "Connected",
  delayed: "Delayed",
  disconnected: "Disconnected",
  configuration_required: "Configuration required",
} as const;

interface ImportedTimeframe {
  fileName: string;
  candles: NonNullable<TradingAnalysisInputTimeframes["30M"]>;
  warnings: string[];
}

type AnalysisMode = "csv" | "provider";

interface AnalysisError {
  mode: AnalysisMode;
  message: string;
}

export const TradingPage = () => {
  const { session } = useAuth();
  const memberId = session?.user?.id ?? null;
  const [symbol, setSymbol] = useState("XAUUSD");
  const [imports, setImports] = useState<Partial<Record<TradingTimeframe, ImportedTimeframe>>>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TradingAnalysisResponse | null>(null);
  const [providerAnalysis, setProviderAnalysis] = useState<MarketDataAnalysisResponse | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<AnalysisMode | null>(null);
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(null);
  const revision = useRef(0);
  const previousMemberId = useRef(memberId);
  const fileRevisions = useRef<Partial<Record<TradingTimeframe, number>>>({});
  const pendingReads = useRef(0);
  const [isReading, setIsReading] = useState(false);
  const analyze = useAnalyzeTrading({
    request: session?.access_token
      ? { headers: { Authorization: `Bearer ${session.access_token}` } }
      : undefined,
  });
  const marketDataStatus = useGetMarketDataStatus({
    query: {
      enabled: Boolean(session?.access_token),
      refetchInterval: 60_000,
      queryKey: ["/api/workspace/market-data/status", memberId],
    },
    request: session?.access_token
      ? { headers: { Authorization: `Bearer ${session.access_token}` } }
      : undefined,
  });
  const analyzeProviderData = useAnalyzeMarketData({
    request: session?.access_token
      ? { headers: { Authorization: `Bearer ${session.access_token}` } }
      : undefined,
  });

  const invalidateAnalysis = () => {
    revision.current += 1;
    setAnalysis(null);
    setProviderAnalysis(null);
    setPendingAnalysis(null);
    setAnalysisError(null);
  };

  useEffect(() => {
    if (previousMemberId.current !== memberId) {
      previousMemberId.current = memberId;
      invalidateAnalysis();
    }
    return () => {
      revision.current += 1;
    };
  }, [memberId]);

  const handleFile = async (timeframe: TradingTimeframe, file?: File) => {
    invalidateAnalysis();
    const fileRevision = (fileRevisions.current[timeframe] ?? 0) + 1;
    fileRevisions.current[timeframe] = fileRevision;
    setImportError(null);
    if (!file) {
      setImports((current) => {
        const next = { ...current };
        delete next[timeframe];
        return next;
      });
      return;
    }
    pendingReads.current += 1;
    setIsReading(true);
    try {
      if (file.size > 256 * 1024) throw new Error("CSV must be smaller than 256 KB.");
      const parsed = parseMarketCandlesCsv(await file.text());
      if (fileRevisions.current[timeframe] !== fileRevision) return;
      setImports((current) => ({
        ...current,
        [timeframe]: { fileName: file.name, ...parsed },
      }));
    } catch (error) {
      if (fileRevisions.current[timeframe] !== fileRevision) return;
      setImportError(error instanceof Error ? error.message : "This CSV could not be read.");
      setImports((current) => {
        const next = { ...current };
        delete next[timeframe];
        return next;
      });
    } finally {
      pendingReads.current -= 1;
      setIsReading(pendingReads.current > 0);
    }
  };

  const submitAnalysis = () => {
    const requestRevision = ++revision.current;
    const timeframes: TradingAnalysisInputTimeframes = {};
    for (const timeframe of TIMEFRAMES) {
      const file = imports[timeframe];
      if (file) timeframes[timeframe] = file.candles;
    }
    setPendingAnalysis("csv");
    setAnalysisError(null);
    setAnalysis(null);
    setProviderAnalysis(null);
    analyze.mutate({ data: { symbol: symbol.trim(), timeframes } }, {
      onSuccess: (result) => {
        if (requestRevision !== revision.current) return;
        setAnalysis(result);
        setPendingAnalysis(null);
      },
      onError: (error) => {
        if (requestRevision !== revision.current) return;
        setAnalysisError({
          mode: "csv",
          message: error instanceof Error ? error.message : "Analysis request failed. Please try again.",
        });
        setPendingAnalysis(null);
      },
    });
  };

  const submitProviderAnalysis = () => {
    if (!symbol.trim()) return;
    const requestRevision = ++revision.current;
    setPendingAnalysis("provider");
    setAnalysisError(null);
    setAnalysis(null);
    setProviderAnalysis(null);
    analyzeProviderData.mutate(
      { data: { symbol: symbol.trim() } },
      {
        onSuccess: (result) => {
          if (requestRevision !== revision.current) return;
          setProviderAnalysis(result);
          setPendingAnalysis(null);
          void marketDataStatus.refetch();
        },
        onError: () => {
          if (requestRevision !== revision.current) return;
          setAnalysisError({
            mode: "provider",
            message: "Market data could not be retrieved. No live signal was generated; CSV import remains available.",
          });
          setPendingAnalysis(null);
        },
      },
    );
  };

  const complete = TIMEFRAMES.every((timeframe) =>
    (imports[timeframe]?.candles.length ?? 0) >= MIN_CANDLES,
  );

  return (
    <div className="relative space-y-5">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 right-0 -z-10 h-64 w-64 rounded-full bg-[#7C5CFF]/10 blur-3xl" />
      <header className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#168BFF]">Trading intelligence · structural analysis</p>
            <h1 className="mt-1 text-xl font-extrabold text-[#E8F2EE]">Multi-timeframe market review</h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#A9BEB5]">
              Fetch validated 30M, 1H, 4H, and 1D candles from the server-configured provider, or keep using broker CSV imports. Provider credentials stay server-side.
            </p>
          </div>
          <span
            role="status"
            data-testid="status-market-data"
            className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase ${
              marketDataStatus.data?.connectionState === "connected"
                ? "border-[#16A36A]/30 bg-[#16A36A]/10 text-[#16A36A]"
                : marketDataStatus.data?.connectionState === "delayed"
                  ? "border-[#E69A36]/30 bg-[#E69A36]/10 text-[#E69A36]"
                  : "border-[#E69A36]/30 bg-[#E69A36]/10 text-[#E69A36]"
            }`}
          >
            {marketDataStatus.data
              ? CONNECTION_LABELS[marketDataStatus.data.connectionState]
              : "Disconnected"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#A9BEB5]">
          <span>Provider: {marketDataStatus.data?.providerName ?? "Status unavailable"}</span>
          <span>Mode: {marketDataStatus.data?.dataMode ?? "unavailable"}</span>
          <span>
            Last successful update: {marketDataStatus.data?.lastSuccessfulUpdateAt
              ? new Date(marketDataStatus.data.lastSuccessfulUpdateAt).toLocaleString()
              : "None yet"}
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#A9BEB5]">
          {marketDataStatus.data?.message ?? "Provider status is unavailable. CSV imports remain available."}
        </p>
      </header>

      <section className="rounded-2xl border border-[#1A363E] bg-[#152B30] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_2fr]">
          <label className="block text-xs font-semibold text-[#E8F2EE]">
            Select instrument
            <select
              value={INSTRUMENT_PRESETS.includes(symbol.toUpperCase()) ? symbol.toUpperCase() : "CUSTOM"}
              onChange={(event) => {
                invalidateAnalysis();
                setSymbol(event.target.value === "CUSTOM" ? "" : event.target.value);
              }}
              data-testid="select-market-instrument"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#1A363E] bg-[#101B20] px-3 text-sm text-[#E8F2EE] outline-none focus:border-[#168BFF] focus-visible:ring-2 focus-visible:ring-[#168BFF]/40"
            >
              {INSTRUMENT_PRESETS.map((instrument) => (
                <option key={instrument} value={instrument}>{instrument}</option>
              ))}
              <option value="CUSTOM">Custom broker symbol</option>
            </select>
            <span className="mt-3 block">Broker symbol or alias</span>
            <input
              type="text"
              value={symbol}
              onChange={(event) => {
                invalidateAnalysis();
                setSymbol(event.target.value);
              }}
              placeholder="e.g. XAUUSDm, BTCUSD.a, US30.cash"
              data-testid="input-trading-symbol"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#1A363E] bg-[#101B20] px-3 font-mono text-sm text-[#E8F2EE] outline-none focus:border-[#168BFF] focus-visible:ring-2 focus-visible:ring-[#168BFF]/40"
            />
            <span className="mt-1 block text-[10px] font-normal text-[#A9BEB5]">
              Non-default BTC pairs and broker CFDs need an exact server-side provider symbol mapping.
            </span>
          </label>

          <div>
            <p className="text-xs font-semibold text-[#E8F2EE]">Import OHLC CSV files</p>
            <p className="mt-1 text-[10px] text-[#A9BEB5]">Columns: timestamp/date, open, high, low, close; optional volume. Use oldest-to-newest closed candles, at least {MIN_CANDLES} and at most {MAX_CANDLES} per timeframe. Unix seconds, milliseconds, or ISO dates are accepted.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TIMEFRAMES.map((timeframe) => {
                const imported = imports[timeframe];
                return (
                  <label key={timeframe} className="flex min-h-[88px] cursor-pointer items-center gap-3 rounded-xl border border-[#1A363E] bg-[#101B20] p-3 hover:border-[#16A36A]/50 focus-within:border-[#168BFF] focus-within:ring-2 focus-within:ring-[#168BFF]/40">
                    <FileUp className="size-4 shrink-0 text-[#168BFF]" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-bold text-[#E8F2EE]">{timeframe}</span>
                      <span className="block text-[9px] text-[#A9BEB5]">{TIMEFRAME_DESCRIPTIONS[timeframe]}</span>
                      <span className={`mt-1 block truncate text-[10px] ${imported ? "text-[#16A36A]" : "text-[#A9BEB5]"}`}>
                        {imported ? `${imported.candles.length} historical candles · ${imported.fileName}` : "Choose CSV file"}
                      </span>
                      {imported && imported.candles.length < MIN_CANDLES && <span className="mt-1 block text-[9px] text-[#E69A36]" data-testid={`status-short-${timeframe}`}>Below {MIN_CANDLES} candles: this timeframe will be treated as unavailable.</span>}
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
        {analysisError?.mode === "csv" && <p role="alert" className="mt-3 rounded-lg border border-[#E05252]/30 bg-[#E05252]/10 p-3 text-xs text-[#FF9696]">{analysisError.message}</p>}
        {analysisError?.mode === "provider" && <p role="alert" data-testid="error-market-provider" className="mt-3 rounded-lg border border-[#E05252]/30 bg-[#E05252]/10 p-3 text-xs text-[#FF9696]">{analysisError.message}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submitProviderAnalysis}
            disabled={
              !symbol.trim() ||
              pendingAnalysis === "provider" ||
              isReading ||
              marketDataStatus.data?.connectionState === "configuration_required"
            }
            data-testid="button-analyze-provider"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#16A36A] px-4 text-xs font-bold text-[#E8F2EE] transition-colors hover:bg-[#148f5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAnalysis === "provider" && <LoaderCircle className="size-4 animate-spin" />}
            {pendingAnalysis === "provider" ? "Fetching market data…" : "Fetch and analyze provider data"}
          </button>
          <button
            type="button"
            onClick={submitAnalysis}
            disabled={!symbol.trim() || pendingAnalysis === "csv" || isReading}
            data-testid="button-analyze-market"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#16A36A] px-4 text-xs font-bold text-[#E8F2EE] transition-colors hover:bg-[#148f5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAnalysis === "csv" && <LoaderCircle className="size-4 animate-spin" />}
            {pendingAnalysis === "csv" ? "Analyzing candles…" : "Analyze CSV data"}
          </button>
          <span aria-live="polite" className="text-[10px] text-[#A9BEB5]">
            {complete ? "All four timeframes are loaded." : `Each timeframe needs at least ${MIN_CANDLES} closed candles. Missing or short timeframes return NO TRADE with data marked unavailable.`}
          </span>
        </div>
      </section>

      {providerAnalysis && (
        <TradingAnalysisResults
          analysis={providerAnalysis.analysis}
          provenance={providerAnalysis}
        />
      )}
      {analysis && <TradingAnalysisResults analysis={analysis} />}
    </div>
  );
};
