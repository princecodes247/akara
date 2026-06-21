import type { Request, Response, NextFunction } from "express";
import { projectsService } from "../projects/projects.service";

export class PublicController {
  async getPublicProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const data = await projectsService.getPublicProjectData(id);
      res.json(data);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async downloadAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, releaseId, assetId } = req.params as { id: string; releaseId: string; assetId: string };
      const repo = req.query.repo as string | undefined;

      const downloadUrl = await projectsService.getAssetDownloadUrl(id, releaseId, assetId, repo);
      
      // Redirect the user to the presigned S3 URL
      res.redirect(302, downloadUrl);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const publicController = new PublicController();
