import { Router } from "express";
import { githubController } from "./github.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export const githubRouter = Router();

// Protect these routes with JWT authentication
githubRouter.use(requireAuth);

githubRouter.get("/repos", githubController.getRepos);
githubRouter.get("/releases", githubController.getReleases);
