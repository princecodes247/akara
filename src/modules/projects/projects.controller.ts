import type { Request, Response, NextFunction } from "express";
import { projectsService } from "./projects.service";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { githubService } from "../github/github.service";

export class ProjectsController {
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectsService.getAllProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, sourceRepos, targetRepo } = req.body;
      const githubToken = req.user?.githubToken;
      const username = req.user?.username;

      if (!githubToken || !username) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let normalizedTargetRepo = targetRepo || null;

      if (normalizedTargetRepo) {
        if (!normalizedTargetRepo.includes("/")) {
          normalizedTargetRepo = `${username}/${normalizedTargetRepo}`;
        }

        // Check if targetRepo exists, create if not
        const exists = await githubService.checkRepoExists(githubToken, normalizedTargetRepo);
        if (!exists) {
          await githubService.createRepo(githubToken, username, normalizedTargetRepo);
        }
      }

      const result = await projectsService.createProject({ name, sourceRepos, targetRepo: normalizedTargetRepo });
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
