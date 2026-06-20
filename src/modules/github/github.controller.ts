import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { githubService } from "./github.service";

export class GithubController {
  async getRepos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const githubToken = req.user?.githubToken;
      if (!githubToken) {
        return res.status(401).json({ error: "No GitHub token found in session" });
      }

      const repos = await githubService.getUserRepos(githubToken);
      res.json(repos);
    } catch (error) {
      next(error);
    }
  }

  async getReleases(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const githubToken = req.user?.githubToken;
      if (!githubToken) {
        return res.status(401).json({ error: "No GitHub token found in session" });
      }

      const repo = req.query.repo as string;
      if (!repo) {
        return res.status(400).json({ error: "Missing repo query parameter (e.g. org/name)" });
      }

      const releases = await githubService.getRepoReleases(githubToken, repo);
      res.json(releases);
    } catch (error) {
      next(error);
    }
  }
}

export const githubController = new GithubController();
