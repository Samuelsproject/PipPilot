import { Router, type IRouter } from "express";
import { GetWorkspaceAccessResponse } from "@workspace/api-zod";
import { createRequireApprovedMembership } from "../middlewares/require-membership";
import type { MembershipClientProvider } from "../middlewares/require-membership";

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

  return router;
}

export default createWorkspaceRouter();
