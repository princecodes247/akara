import config from '../../lib/config';
import type { Request, Response, NextFunction } from "express";
import { projectsService } from "../projects/projects.service";

export class PublicController {
  getOpenApiSpec(req: Request, res: Response) {
    const spec = {
      openapi: "3.1.0",
      info: {
        title: "Akara Public API",
        version: "1.0.0",
        description: "Public endpoints for accessing Akara projects and downloading release assets."
      },
      servers: [
        {
          url: `${config.BASE_URL}/api/public`,
          description: "Local Backend Server"
        }
      ],
      paths: {
        "/projects/{id}": {
          get: {
            summary: "Get Public Project",
            description: "Retrieves metadata and all public releases for a specific project.",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "The unique identifier of the project."
              }
            ],
            responses: {
              "200": {
                description: "Project and releases data"
              },
              "404": {
                description: "Project not found"
              }
            }
          }
        },
        "/projects/{id}/current": {
          get: {
            summary: "Get Current Release",
            description: "Retrieves the single release explicitly marked as current, or the newest published release.",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "The unique identifier of the project."
              }
            ],
            responses: {
              "200": {
                description: "The current release data"
              },
              "404": {
                description: "No current release found"
              }
            }
          }
        },
        "/projects/{id}/releases/{releaseId}/assets/{assetId}": {
          get: {
            summary: "Download Asset",
            description: "Redirects to the pre-signed download URL for a specific asset within a public release.",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "The unique identifier of the project."
              },
              {
                name: "releaseId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "The staged release ID."
              },
              {
                name: "assetId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "The asset ID from the source repository."
              },
              {
                name: "repo",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "The full name of the original source repository (e.g. owner/repo)."
              }
            ],
            responses: {
              "302": {
                description: "Redirects to the asset download URL."
              },
              "404": {
                description: "Asset or release not found."
              }
            }
          }
        }
      }
    };
    res.json(spec);
  }
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

  async getCurrentRelease(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const current = await projectsService.getCurrentRelease(id);
      if (!current) {
        return res.status(404).json({ error: "No current release found for this project." });
      }
      res.json(current);
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
