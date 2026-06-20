import { Router } from "express";
import { projectsController } from "./projects.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", projectsController.getProjects);
projectsRouter.post("/", projectsController.createProject);
