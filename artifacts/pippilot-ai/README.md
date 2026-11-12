# PipPilotAi

PipPilotAi is an independent, mobile-first foundation for a future trading
intelligence product. This stage establishes the React application, visual
identity, reusable structure, and clear extension points.

## Current scope

The app does not currently connect to Supabase, a FastAPI backend, MetaTrader 5,
market-data providers, or an economic calendar. Authentication, trading analysis,
signals, execution, payments, and account management are not implemented.
Future-facing screens must not be treated as live services or trading data.

The future product direction includes XAUUSD, forex pairs, US30, and US100; multi-
timeframe analysis; SMC, ICT, and CRT concepts; trade ideas reviewed by the user;
economic events such as CPI, PPI, NFP, and FOMC; risk controls; and signal history
and performance tracking. These are roadmap items only.

## Run locally

From the workspace root:

```sh
pnpm --filter @workspace/pippilot-ai run dev
```

Check types and create a production build:

```sh
pnpm --filter @workspace/pippilot-ai run typecheck
pnpm --filter @workspace/pippilot-ai run build
```

## Project structure

```text
src/
  auth/          Authentication extension point; no provider is configured
  components/    Reusable interface components
  config/        App and runtime configuration
  layouts/       Shared page structure
  pages/         Route-level screens
  services/api/  Backend client extension point; no API is connected
  styles/        Shared styling and design tokens
  types/         Shared TypeScript contracts
```

The Vite app is the mobile-first client. Future authentication and database
work should use Supabase when explicitly added; server-side application logic
belongs in a separate FastAPI service, and MT5 execution remains a separate
service. None of those systems are created or configured in this foundation.

## Environment and credentials

Copy `.env.example` to `.env.local` for local, non-secret settings. Variables
prefixed with `VITE_` are included in browser code and must never contain API
keys, passwords, tokens, or other secrets. Add future provider credentials
through server-side secret storage only.
