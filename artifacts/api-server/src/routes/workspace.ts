import { Router, type IRouter } from "express";
import {
  AnalyzeTradingBody,
  AnalyzeTradingResponse,
  GetWorkspaceAccessResponse,
} from "@workspace/api-zod";
import { createRequireApprovedMembership } from "../middlewares/require-membership";
import type { MembershipClientProvider } from "../middlewares/require-membership";
import { analyzeTrading, TradingInputError } from "../lib/trading-analysis";

export function createWorkspaceRouter(
  provideClient?: MembershipClientProvider,
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

  return router;
}

export default createWorkspaceRouter();
