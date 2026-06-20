import type { Request, Response, NextFunction } from "express";
import { projectsService } from "./projects.service";

export class ProjectsController {
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectsService.getAllProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, sourceRepos, targetRepo } = req.body;
      const result = await projectsService.createProject({ name, sourceRepos, targetRepo });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === "Missing required fields") {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const projectsController = new ProjectsController();
