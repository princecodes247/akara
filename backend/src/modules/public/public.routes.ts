import { Router } from "express";
import { publicController } from "./public.controller";
import { apiReference } from "@scalar/express-api-reference";

export const publicRouter = Router();

publicRouter.use("/docs", apiReference({
  theme: "default",
  spec: {
    url: "/v1/public/openapi.json"
  }
}));
publicRouter.get("/openapi.json", publicController.getOpenApiSpec);

publicRouter.get("/projects/:id", publicController.getPublicProject);
publicRouter.get("/projects/:id/current", publicController.getCurrentRelease);
publicRouter.get("/projects/:id/releases/:releaseId/assets/:assetId", publicController.downloadAsset);
publicRouter.get("/projects/:id/ota/:platform/:currentVersion", publicController.getOtaUpdate);
publicRouter.get("/projects/:id/ota/:framework/manifest", publicController.getFrameworkManifest);
