import type { Request, Response, NextFunction } from "express";
import { projectsService } from "./projects.service";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { githubService } from "../github/github.service";
import { cached } from "../../lib/cache";

const getCachedProjectReleases = cached(
  (id: string, githubToken: string, userId: string | undefined) =>
    projectsService.getProjectReleases(id, githubToken, userId),
  {
    key: (id: string, githubToken: string, userId: string | undefined) => {
      return `project:releases:${id}:${userId}`;
    },
    ttlSeconds: 120
  }
);

export class ProjectsController {
  async getProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const projects = await projectsService.getAllProjects(userId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const project = await projectsService.getProjectById(id, userId);
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
      const userId = req.user?.userId;

      if (!githubToken || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const releases = await getCachedProjectReleases(id, githubToken, userId);
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
      const { status, isCurrent, releaseData, customTitle, customBody, customAssets } = req.body;
      const githubToken = req.user?.githubToken;
      const userId = req.user?.userId;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const sanitizeHtml = (await import("sanitize-html")).default;
      const cleanCustomBody = customBody ? sanitizeHtml(customBody, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['class', 'id', 'style'],
        }
      }) : customBody;

      const mapping = await projectsService.updateReleaseMapping(id, releaseId, { status, isCurrent, releaseData, githubToken, customTitle, customBody: cleanCustomBody, customAssets }, userId);
      res.json(mapping);
    } catch (error) {
      next(error);
    }
  }

  async deleteReleaseMapping(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, releaseId } = req.params as { id: string; releaseId: string };
      const userId = req.user?.userId;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      await projectsService.deleteStagedRelease(id, releaseId, userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async syncReleaseAssets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, releaseId } = req.params as { id: string; releaseId: string };
      const userId = req.user?.userId;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const updatedRelease = await projectsService.syncReleaseAssets(id, releaseId, userId);
      res.json(updatedRelease);
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

      const userId = req.user?.userId;
      const result = await projectsService.createProject({ name, sourceRepos, targetRepo: normalizedTargetRepo, userId });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === "Missing required fields") {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { name, sourceRepos, targetRepo, slug, seoTitle, seoDescription, isPublic } = req.body;
      const username = req.user?.username;
      const githubToken = req.user?.githubToken;
      const userId = req.user?.userId;

      if (!githubToken || !username || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let normalizedTargetRepo = targetRepo || null;
      if (normalizedTargetRepo) {
        if (!normalizedTargetRepo.includes("/")) {
          normalizedTargetRepo = `${username}/${normalizedTargetRepo}`;
        }
        const exists = await githubService.checkRepoExists(githubToken, normalizedTargetRepo);
        if (!exists) {
          await githubService.createRepo(githubToken, username, normalizedTargetRepo);
        }
      }

      await projectsService.updateProject(id, { name, sourceRepos, targetRepo: normalizedTargetRepo, slug, seoTitle, seoDescription, isPublic }, userId);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Missing required fields" || error.message === "Invalid slug") {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === "Slug is already in use") {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  }

  async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.userId;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      await projectsService.deleteProject(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const projectsController = new ProjectsController();
