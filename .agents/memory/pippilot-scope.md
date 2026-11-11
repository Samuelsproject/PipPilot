---
name: PipPilotAi scope
description: Product boundaries and visual direction for future PipPilotAi work.
---

PipPilotAi is a standalone product and must not modify or reuse ApexGold.

The initial foundation is intentionally non-trading: do not add trade logic,
signals, MT5 execution, payments, economic-data integrations, or authentication
integrations until the user asks for a later stage. Never present simulated
balances, performance, or live market data as real.

The requested visual identity uses emerald green, electric blue for financial
statistics, a subtle purple glow around selected typography, deep charcoal or
navy surfaces, and orange/red for warnings and risk indicators. The first
interface prioritizes Android mobile browsers.

**Why:** The user explicitly separated PipPilotAi from ApexGold and limited this
stage to a reliable foundation.

**How to apply:** Keep future work scoped to PipPilotAi. Treat every external
service as disconnected until it is actually integrated and verified.
