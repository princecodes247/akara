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
}

export const publicController = new PublicController();
