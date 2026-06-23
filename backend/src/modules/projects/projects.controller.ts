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

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };

      const project = await projectsService.getProjectById(id);
      res.json(project);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getProjectReleases(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const githubToken = req.user?.githubToken;

      if (!githubToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const releases = await projectsService.getProjectReleases(id, githubToken);
      res.json(releases);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async updateReleaseMapping(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, releaseId } = req.params as { id: string; releaseId: string };
      const { status, isCurrent, releaseData } = req.body;
      const githubToken = req.user?.githubToken;

      const mapping = await projectsService.updateReleaseMapping(id, releaseId, { status, isCurrent, releaseData, githubToken });
      res.json(mapping);
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

      const githubId = String(req.user?.userId);
      const result = await projectsService.createProject({ name, sourceRepos, targetRepo: normalizedTargetRepo, githubId });
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
