import { Router } from "express";
import { publicController } from "./public.controller";
import { apiReference } from "@scalar/express-api-reference";

export const publicRouter = Router();

publicRouter.use("/docs", apiReference({
  theme: "default",
  spec: {
    url: "/api/public/openapi.json"
  }
}));
publicRouter.get("/openapi.json", publicController.getOpenApiSpec);

publicRouter.get("/projects/:id", publicController.getPublicProject);
publicRouter.get("/projects/:id/current", publicController.getCurrentRelease);
publicRouter.get("/projects/:id/releases/:releaseId/assets/:assetId", publicController.downloadAsset);
