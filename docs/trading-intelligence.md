# Trading intelligence: implemented scope and data limits

The Trading workspace uses a deterministic, server-side candle analysis engine.
It is not an LLM price forecaster, live quote service, or execution bridge.

## Operational data path

- An approved member imports one OHLC CSV per timeframe: `1D`, `4H`, `1H`,
  and `30M`. Files stay in browser memory until the analysis request; neither
  candle uploads nor proposals are persisted in a database.
- CSV headers are `timestamp,open,high,low,close`, with optional `volume`.
  `datetime`, `date`, and separate `date,time` are also accepted. Use an explicit
  timezone (preferably UTC) for dates, or Unix seconds/milliseconds. Rows must
  be oldest first. Maximum: 200 rows and 256 KB per file.
- The membership-protected `POST /api/workspace/trading/analyze` validates the
  generated OpenAPI/Zod input, then checks OHLC relationships, finite positive
  prices, timestamps, ordering, and non-overlapping candle intervals.
- At least 50 **closed** candles per timeframe are required. Unfinished bars
  are excluded. Future bars, inconsistent prices, and unsupported symbols
  cannot produce a proposal.
- Responses explicitly identify `user_supplied_historical` or `unavailable`.
  No live, delayed, or simulated provider is represented as connected. The
  “price” is the latest imported completed 30M close, not an executable quote.
- Broker aliases are normalized to a canonical instrument while preserving
  the original symbol. Gold, BTC/USD/stablecoin/major-fiat pairs, supported
  forex currency combinations, and major index aliases are recognized.
  Unrecognized aliases fail to an unavailable NO TRADE result; no broker
  instrument catalogue or contract specification is connected.

## Analysis rules

Daily direction has priority. 4H supplies intermediate context; 1H supplies
confirmation; 30M supplies the entry trigger. An opposite directional timeframe
is reported explicitly and blocks a proposal. Neutral 4H or 30M structure
does not invent agreement: it reduces the confluence score and still needs
Daily direction, 1H confirmation, and an eligible 30M trigger.

The rule-based concepts are candle proxies, not evidence of institutional
orders, actual order-book liquidity, or trader intent:

- Confirmed swing pivots require two bars on each side. HH/HL and LH/LL use
  consecutive confirmed swing comparisons.
- BOS is a newly closed break of a confirmed swing. CHOCH is such a break
  against a previously confirmed swing trend.
- A sweep runs a confirmed swing then closes back inside. Equal highs/lows
  use an ATR/price-based tolerance. “Inducement” is explicitly labeled a
  potential proxy, not a statement about actual positioning.
- An order-block candidate requires an opposing candle before both a
  structural break and a displacement-sized body. Supply/demand references
  come from that same evidenced range.
- FVG requires consecutive three-candle separation and a directional
  middle body of at least 0.45 ATR. Fully filled gaps are excluded.
- CRT requires a one-sided prior-range sweep followed by a close back inside.
  30M/1H provide intraday candidates; 4H/Daily provide swing candidates.
  A candle sweeping both sides does not establish a directional CRT setup.
- Premium/discount uses the midpoint of the observed 20-bar range.
  Support/resistance uses confirmed swings.
- Indicators: mean true range over 14 changes, simple-window RSI(14), and
  recursively seeded EMA(20)/EMA(50). These transparent definitions are not
  asserted to match every broker's indicator implementation.

## Risk and proposal lifecycle

Proposals require directional context plus an actual 30M reclaim/sweep.
The stop is beyond the last six 30M candles with a 0.15 ATR buffer. The
engine rejects nonpositive risk, stops wider than 2.5 ATR, excessive ATR/price,
and observed opposing swing levels before a minimum 2:1 reward.
TP1/TP2/TP3 are explicitly **calculated 2R/3R/4R objectives**, not detected
liquidity levels or forecasts. Broker tick size, spread, slippage, margin,
and minimum stop distance are not connected and must be independently checked.

The confidence number is a transparent confluence score capped at 85, not a
backtested win probability or promise of profit. Missing/stale data, structural
conflicts, unsuitable volatility, or insufficient confirmation produce NO TRADE.
BTC uses a continuous 24/7 schedule and a distinct volatility suitability
threshold; no forex weekend closure is applied. These thresholds are
conservative engineering rules, not empirically calibrated market models.

Freshness is checked per timeframe. A review window expires two 30M intervals
after the source candle's open. The browser suppresses expired proposals.
Every analysis request recomputes from the supplied bars. The server also has
a pure validity evaluator for subsequent observed stop/target crossings and
higher-timeframe reversals; there is no background market monitor, saved signal
ledger, or automatic refresh from an external feed. A missing new quote cannot
prove that conditions remain valid.

No trade is submitted, transmitted, or automatically approved. No MT5
connection or simulated execution is created by this engine.

## News, database, and integration boundaries

No reliable economic calendar/news provider is connected. CPI, PPI, NFP,
and FOMC remain the intended event set; PCE is excluded. The engine returns
an unavailable macro hypothesis with **no invented percentage**. Event proximity,
news blackouts, and cross-market event bias cannot presently be verified.
The existing separate News page remains an explicitly labeled illustrative
calendar, not an operational news source.

No paid service, new secret, live Supabase change, database schema, or RLS
policy is introduced. Existing Supabase authentication and server membership
authorization are reused. The repository has no defined private trading-record
schema to secure, so no speculative persistence or cross-user record API is
added. A future provider must keep credentials server-side, supply verifiable
provenance/delay/timestamps, and add explicit broker mapping/session rules.
