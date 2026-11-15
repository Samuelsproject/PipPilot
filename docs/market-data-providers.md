# PipPilotAi market-data provider setup

Research was checked on 2026-11-15. No live provider connection or provider credential was available in this workspace during implementation. The Trading workspace therefore reports its actual readiness state and continues to use CSV imports; it does not fabricate quotes or candles.

## Provider decision

### Twelve Data adapter

Twelve Data is the only external provider adapter currently implemented. Its API documents quote and time-series endpoints, 30-minute, 1-hour, 4-hour and daily intervals, UTC output for intraday candles, exchange-local timestamps for daily candles, and an `is_market_open` quote field. Its catalogs cover precious-metal/forex pairs and crypto pairs, including XAU/USD and BTC/USD. The exact provider contract for a broker CFD such as US30 or US100 is not assumed: those instruments require an explicit `MARKET_DATA_SYMBOL_MAP_JSON` entry and the matching provider exchange.

The default verified mappings are XAU/USD, BTC/USD, and supported six-letter forex pairs. Other BTC quote pairs and all broker-specific CFD/index contracts require an explicit mapping because their exact provider symbol, exchange, and entitlement have not been verified. A mapping is not proof that the provider offers or licenses that symbol.

The provider's official business pricing lists a free evaluation tier with 8 credits per minute and an 800-credit daily cap. The Venture business tier was listed from **$149/month** with 610 credits per minute and external display for eligible markets. Individual plans are for personal/internal use, not public commercial display. Exchange fees, non-US market approval, redistribution rights, and the exact symbol's entitlement may add requirements. External display does not imply permission to redistribute raw data. Confirm the account's exact rights with the provider before enabling display. No subscription was purchased or enabled.

An analysis makes five provider calls (one quote plus four time-series requests); Twelve Data documents one credit per symbol for each of these endpoints. Local request limits default conservatively to 8 credits/minute and 800/day. Increase them only to match the account's contractual quota. The in-memory limiter is per server process; it is not a shared quota across multiple deployment replicas.

### Other providers reviewed

- **Alpha Vantage:** its official pricing page lists 25 requests/day on the free tier and paid tiers starting at $49.99/month. Its API covers several asset classes, but exact entitlements for these instruments/timeframes and suitable display rights were not verified for this product. The workspace connection found was an MCP connector, not a ready application API credential. No adapter was added.
- **Coinbase Exchange public market data:** public candle endpoints exist, but the Market Data Terms restrict use to personal/research contexts and do not permit third-party app display/derived works without written consent. It is not used by PipPilotAi.

The server-side `MarketDataProvider` interface and registration path allow additional adapters to be added when both data coverage and display rights are confirmed. CSV import remains the working fallback.

## Server-only configuration

Do not prefix these settings with `VITE_`. Keep `TWELVE_DATA_API_KEY` in Replit Secrets so it is available only to the Express runtime. Never put it in a browser environment variable, request body, response, error message, or application log.

Required settings:

- `MARKET_DATA_PROVIDER=twelvedata`
- `TWELVE_DATA_API_KEY` — provider credential, stored as a server-side secret
- `MARKET_DATA_EXTERNAL_DISPLAY_LICENSED=true` — set only after confirming written external-display and applicable exchange/region rights
- `MARKET_DATA_FEED_MODE=live` or `delayed` — must reflect the account's actual feed entitlement
- `MARKET_DATA_SYMBOL_MAP_JSON` — optional JSON object mapping broker aliases and non-default pairs to exact provider symbols; required for unverified BTC pairs and CFD/index contracts
- `MARKET_DATA_CREDITS_PER_MINUTE` and `MARKET_DATA_CREDITS_PER_DAY` — optional local safeguards; defaults are 8 and 800

Example mapping format (replace placeholders only after verifying the instrument and exchange in the provider catalog):

```json
{
  "US30": { "symbol": "provider-specific-symbol", "exchange": "provider-exchange" },
  "US100": { "symbol": "provider-specific-symbol", "exchange": "provider-exchange" }
}
```

The configuration readiness endpoint does not return the credential or symbol-map contents. It reports `configuration_required` until server credentials, feed classification, and display approval are present.

## Data handling

- Provider responses are validated before analysis; timestamps are converted using UTC for intraday data and provider exchange timezone for daily data.
- Bitcoin is treated as 24/7. Other instruments require provider confirmation that the market is open before a current signal can be shown; unknown or closed sessions are not treated as continuous trading.
- A live signal requires a fresh quote and four sufficiently long, fresh timeframes. Delayed feeds, stale data, closed/unknown sessions, missing candles, malformed data, or provider failures return no live signal.
- Complete responses are cached in memory for at most 15 seconds. Expired cache entries are discarded, not served as live. Partial failures are not cached.
- The public API returns provenance and derived analysis, not the provider's raw candle series.
- Provider timeouts, provider quota responses, a per-user request limit, and conservative process-local credit budgets are enforced. A provider's own account-wide quota remains the final safeguard across application replicas.

Official sources:

- [Twelve Data business pricing](https://twelvedata.com/pricing-business)
- [Twelve Data time-series API](https://twelvedata.com/docs/market-data/time-series)
- [Twelve Data quote API](https://twelvedata.com/docs/market-data/quote)
- [Twelve Data symbol search](https://twelvedata.com/docs/discovery/symbol-search)
- [Twelve Data commercial and personal use](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage)
- [Twelve Data API credits](https://support.twelvedata.com/en/articles/5615854-credits)
- [Alpha Vantage pricing](https://www.alphavantage.co/premium/)
- [Coinbase Market Data Terms](https://www.coinbase.com/legal/market_data)
