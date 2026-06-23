import { Router } from "express";
import { publicController } from "./public.controller";

export const publicRouter = Router();

publicRouter.get("/projects/:id", publicController.getPublicProject);
publicRouter.get("/projects/:id/current", publicController.getCurrentRelease);
publicRouter.get("/projects/:id/releases/:releaseId/assets/:assetId", publicController.downloadAsset);
