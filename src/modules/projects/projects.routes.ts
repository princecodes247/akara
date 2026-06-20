import { Router } from "express";
import { projectsController } from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.get("/", projectsController.getProjects);
projectsRouter.post("/", projectsController.createProject);
