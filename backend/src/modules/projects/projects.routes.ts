import { Router } from "express";
import { projectsController } from "./projects.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", projectsController.getProjects);
projectsRouter.get("/:id", projectsController.getProjectById);
projectsRouter.get("/:id/releases", projectsController.getProjectReleases);
projectsRouter.patch("/:id/releases/:releaseId/mapping", projectsController.updateReleaseMapping);
projectsRouter.delete("/:id/releases/:releaseId/mapping", projectsController.deleteReleaseMapping);
projectsRouter.post("/", projectsController.createProject);
