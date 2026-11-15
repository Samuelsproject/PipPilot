import { Router, type IRouter } from "express";
import {
  AnalyzeMarketDataBody,
  AnalyzeMarketDataResponse,
  AnalyzeTradingBody,
  AnalyzeTradingResponse,
  GetMarketDataStatusResponse,
  GetWorkspaceAccessResponse,
} from "@workspace/api-zod";
import { createRequireApprovedMembership } from "../middlewares/require-membership";
import type { MembershipClientProvider } from "../middlewares/require-membership";
import { analyzeTrading, TradingInputError } from "../lib/trading-analysis";
import {
  createDefaultMarketDataService,
  MarketDataService,
  MarketDataServiceError,
} from "../lib/market-data/service";

const defaultMarketDataService = createDefaultMarketDataService();

export function createWorkspaceRouter(
  provideClient?: MembershipClientProvider,
  marketDataService: MarketDataService = defaultMarketDataService,
): IRouter {
  const router: IRouter = Router();

  // Keep all workspace data APIs under this prefix so they inherit this gate.
  router.use(
    "/workspace",
    createRequireApprovedMembership(provideClient),
  );

  router.get(
    "/workspace/access",
    (req, res): void => {
      const userId = req.membershipUser?.id;
      if (!userId) {
        res.status(401).json({
          code: "INVALID_TOKEN",
          error: "The authenticated workspace member could not be verified.",
        });
        return;
      }

      res.json(
        GetWorkspaceAccessResponse.parse({
          userId,
          membershipStatus: "active",
        }),
      );
    },
  );

  router.post("/workspace/trading/analyze", (req, res): void => {
    const parsed = AnalyzeTradingBody.safeParse(req.body);
    if (!parsed.success) {
      req.log?.warn({ errors: parsed.error.issues.length }, "Rejected invalid trading analysis input");
      res.status(400).json({ error: "Symbol or candle data is invalid." });
      return;
    }

    try {
      res.json(AnalyzeTradingResponse.parse(analyzeTrading(parsed.data)));
    } catch (error) {
      if (error instanceof TradingInputError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.get("/workspace/market-data/status", (_req, res): void => {
    res.json(GetMarketDataStatusResponse.parse(marketDataService.getStatus()));
  });

  router.post("/workspace/market-data/analyze", async (req, res): Promise<void> => {
    const parsed = AnalyzeMarketDataBody.safeParse(req.body);
    if (!parsed.success) {
      req.log?.warn({ errors: parsed.error.issues.length }, "Rejected invalid provider-backed analysis input");
      res.status(400).json({
        code: "SYMBOL_UNSUPPORTED",
        error: "Enter a supported instrument symbol.",
        retryAfterSeconds: null,
      });
      return;
    }
    const userId = req.membershipUser?.id;
    if (!userId) {
      res.status(401).json({
        code: "INVALID_TOKEN",
        error: "The authenticated workspace member could not be verified.",
      });
      return;
    }

    try {
      const result = await marketDataService.analyze(parsed.data.symbol, userId);
      res.json(AnalyzeMarketDataResponse.parse(result));
    } catch (error) {
      if (error instanceof MarketDataServiceError) {
        req.log?.warn(
          { providerCode: error.logCode, status: error.statusCode },
          "Market-data analysis request was not completed",
        );
        res.status(error.statusCode).json(error.response);
        return;
      }
      req.log?.error(
        { errorType: error instanceof Error ? error.name : "unknown" },
        "Unexpected market-data processing failure",
      );
      res.status(503).json({
        code: "PROVIDER_UNAVAILABLE",
        error: "Market data is temporarily unavailable. No signal was generated.",
        retryAfterSeconds: null,
      });
    }
  });

  return router;
}

export default createWorkspaceRouter();
