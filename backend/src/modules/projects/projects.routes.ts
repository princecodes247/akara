import { Router } from "express";
import { projectsController } from "./projects.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", projectsController.getProjects);
projectsRouter.get("/:id", projectsController.getProjectById);
projectsRouter.patch("/:id", projectsController.updateProject);
projectsRouter.delete("/:id", projectsController.deleteProject);
projectsRouter.get("/:id/releases", projectsController.getProjectReleases);
projectsRouter.patch("/:id/releases/:releaseId/mapping", projectsController.updateReleaseMapping);
projectsRouter.delete("/:id/releases/:releaseId/mapping", projectsController.deleteReleaseMapping);
projectsRouter.post("/:id/releases/:releaseId/sync", projectsController.syncReleaseAssets);
projectsRouter.post("/", projectsController.createProject);
