import { Router } from "express";
import rateLimit from "express-rate-limit";
import { publicController } from "./public.controller";
import { apiReference } from "@scalar/express-api-reference";

export const publicRouter = Router();

const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  limit: 60, // limit each IP to 60 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests to the public API, please try again later.' },
});

publicRouter.use(publicApiLimiter);

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
publicRouter.get("/projects/:id/updates/:platform/:currentVersion", publicController.getOtaUpdate);
publicRouter.get("/projects/:id/updates/:framework/manifest", publicController.getFrameworkManifest);
