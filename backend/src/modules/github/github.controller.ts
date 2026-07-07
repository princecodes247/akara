import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { githubService } from "./github.service";
import { cached } from "../../lib/cache";

const getCachedUserRepos = cached(
  (userId: string, githubToken: string) => githubService.getUserRepos(githubToken),
  {
    key: (userId: string) => `github:user-repos:${userId}`,
    ttlSeconds: 300
  }
);

const getCachedRepoReleases = cached(
  (userId: string | undefined, githubToken: string | undefined, repoFullName: string) =>
    githubService.getRepoReleases(githubToken, repoFullName),
  {
    key: (userId: string | undefined, githubToken: string | undefined, repoFullName: string) => {
      const id = userId || "system";
      return `github:repo-releases:${repoFullName}:${id}`;
    },
    ttlSeconds: 120
  }
);

export class GithubController {
  async getRepos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { githubToken, userId } = req.user as { githubToken: string, userId: string };

      if (!githubToken || !userId) {
        return res.status(401).json({ error: "Unauthorized: Missing token or user session" });
      }

      const repos = await getCachedUserRepos(userId, githubToken);
      res.json(repos);
    } catch (error) {
      next(error);
    }
  }

  async getReleases(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { githubToken, userId } = req.user as { githubToken: string, userId: string };
      if (!githubToken || !userId) {
        return res.status(401).json({ error: "Unauthorized: Missing token or user session" });
      }

      const repo = req.query.repo as string;
      if (!repo) {
        return res.status(400).json({ error: "Missing repo query parameter (e.g. org/name)" });
      }

      const releases = await getCachedRepoReleases(userId, githubToken, repo);
      res.json(releases);
    } catch (error) {
      next(error);
    }
  }
}

export const githubController = new GithubController();
