import config from '../../lib/config';
import type { Request, Response, NextFunction } from "express";
import { projectsService } from "../projects/projects.service";
import semver from "semver";
import { cached } from "../../lib/cache";

const getCachedPublicProjectData = cached(
  (id: string) => projectsService.getPublicProjectData(id),
  {
    key: (id: string) => `project:public-data:${id}`,
    ttlSeconds: 3600 // 1 hour TTL
  }
);

const getCachedCurrentRelease = cached(
  (id: string) => projectsService.getCurrentRelease(id),
  {
    key: (id: string) => `project:current-release:${id}`,
    ttlSeconds: 3600 // 1 hour TTL
  }
);

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
          url: `${config.BASE_URL}/v1/public`,
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
      const data = await getCachedPublicProjectData(id);
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
      const current = await getCachedCurrentRelease(id);
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

      // Record the download asynchronously
      projectsService.recordAssetDownload(id, releaseId, assetId).catch(console.error);

      // Redirect the user to the presigned S3 URL
      res.redirect(302, downloadUrl);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getOtaUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, platform, currentVersion } = req.params as { id: string; platform: string; currentVersion: string };

      // We look up the project by slug or ID
      const currentRelease = await getCachedCurrentRelease(id);

      if (!currentRelease) {
        return res.status(204).send(); // No update available
      }

      // Check version using semver. CurrentRelease.tag might be "v1.2.0". currentVersion might be "1.1.0".
      const releaseVersion = semver.coerce(currentRelease.tag)?.version;
      const clientVersion = semver.coerce(currentVersion)?.version;

      if (!releaseVersion || !clientVersion || semver.lte(releaseVersion, clientVersion)) {
        return res.status(204).send(); // Client is up to date or version invalid
      }

      // Find the specific asset for the requested platform
      const assets = currentRelease.assets || [];
      const platformAsset = assets.find((a: any) => a.tag === platform);

      if (!platformAsset) {
        return res.status(204).send(); // No update for this specific platform
      }

      let signature: string | null = null;
      // Try to find the matching signature file (e.g., app.tar.gz.sig)
      const sigAsset = assets.find((a: any) => a.name === `${platformAsset.name}.sig`);
      
      if (sigAsset && sigAsset.url) {
        try {
          // sigAsset.url is either a direct GitHub release URL or a local Akara redirect URL
          // fetch will follow redirects by default to get the raw string content
          const sigRes = await fetch(sigAsset.url);
          if (sigRes.ok) {
            signature = await sigRes.text();
            signature = signature.trim();
          } else {
            console.error(`Failed to fetch signature from ${sigAsset.url}: ${sigRes.status} ${sigRes.statusText}`);
          }
        } catch (e) {
          console.error("Error fetching signature file:", e);
        }
      }

      if (!signature) {
        console.warn(`No signature found for platform ${platform}. Refusing to serve update.`);
        return res.status(204).send(); // No signature -> no update
      }

      // Identify framework adapter
      const framework = (req.query.framework as string) || "tauri";
      let responsePayload: any;

      if (framework === "tauri") {
        responsePayload = {
          version: currentRelease.tag,
          notes: currentRelease.body || currentRelease.title,
          pub_date: currentRelease.publishedAt || new Date().toISOString(),
          platforms: {
            [platform]: {
              signature: signature,
              url: platformAsset.url
            }
          }
        };
      } else if (framework === "electron") {
        // Placeholder for electron-updater or generic HTTP format
        responsePayload = {
          url: platformAsset.url,
          name: currentRelease.title || currentRelease.tag,
          notes: currentRelease.body,
          pub_date: currentRelease.publishedAt || new Date().toISOString(),
          version: currentRelease.tag,
        };
      } else {
        // Generic JSON fallback
        responsePayload = {
          version: currentRelease.tag,
          notes: currentRelease.body,
          url: platformAsset.url,
          signature: signature,
        };
      }

      res.json(responsePayload);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getFrameworkManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, framework } = req.params as { id: string; framework: string };

      const currentRelease = await getCachedCurrentRelease(id);
      if (!currentRelease) {
        return res.status(404).json({ error: "No current release found." });
      }

      if (framework.toLowerCase() === "expo") {
        const platform = req.headers["expo-platform"] as string;
        const runtimeVersion = req.headers["expo-runtime-version"] as string;

        if (!platform) {
          return res.status(400).json({ error: "Missing 'expo-platform' header." });
        }
        if (!runtimeVersion) {
          return res.status(400).json({ error: "Missing 'expo-runtime-version' header." });
        }

        const assets = currentRelease.assets || [];
        let launchAsset = undefined;
        let updateAssets: any[] = [];

        // Check for metadata.json for Expo OTA updates
        const metadataAsset = assets.find((a: any) => a.name === "metadata.json");
        if (metadataAsset && metadataAsset.url) {
          try {
            const metaRes = await fetch(metadataAsset.url);
            if (metaRes.ok) {
              const metadata = await metaRes.json();
              const platformData = metadata.fileMetadata?.[platform];
              
              if (platformData) {
                // Find the bundle filename, which is the basename of the bundle path
                const bundlePath = platformData.bundle;
                const bundleFilename = bundlePath.substring(bundlePath.lastIndexOf('/') + 1);
                
                const bundleAsset = assets.find((a: any) => a.name === bundleFilename);
                if (bundleAsset) {
                  launchAsset = {
                    hash: bundleAsset.hash || bundleFilename.replace('.hbc', '').replace('.js', ''),
                    key: "bundle",
                    contentType: "application/javascript",
                    url: bundleAsset.url
                  };
                }

                // Map the static assets
                if (platformData.assets && Array.isArray(platformData.assets)) {
                  platformData.assets.forEach((metaAsset: any) => {
                    const assetPath = metaAsset.path;
                    const assetHash = assetPath.substring(assetPath.lastIndexOf('/') + 1);
                    
                    const uploadedAsset = assets.find((a: any) => a.name === assetHash);
                    if (uploadedAsset) {
                      updateAssets.push({
                        hash: assetHash,
                        key: assetHash,
                        fileExtension: `.${metaAsset.ext}`,
                        contentType: metaAsset.ext === 'png' ? 'image/png' : metaAsset.ext === 'jpg' || metaAsset.ext === 'jpeg' ? 'image/jpeg' : metaAsset.ext === 'ttf' ? 'font/ttf' : 'application/octet-stream',
                        url: uploadedAsset.url
                      });
                    }
                  });
                }
              }
            }
          } catch (e) {
            console.error("Failed to fetch or parse metadata.json", e);
          }
        }

        // Fallback to legacy single-asset tag
        if (!launchAsset) {
          const platformAsset = assets.find((a: any) => a.tag === platform);
          if (!platformAsset) {
            return res.status(404).json({ error: `No asset found for platform '${platform}'.` });
          }
          launchAsset = {
            hash: platformAsset.hash || "UNVERIFIED",
            key: "bundle",
            contentType: "application/javascript",
            url: platformAsset.url
          };
        }

        // Return Expo Protocol Version 0 manifest
        const responsePayload = {
          id: currentRelease.id || currentRelease._id || new Date().getTime().toString(),
          createdAt: currentRelease.publishedAt || new Date().toISOString(),
          runtimeVersion: runtimeVersion,
          launchAsset: launchAsset,
          assets: updateAssets,
          metadata: {},
          extra: {
            expoClient: {
              version: currentRelease.tag
            }
          }
        };

        return res.json(responsePayload);
      }

      return res.status(400).json({ error: `Framework '${framework}' not supported for dynamic manifests.` });
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const publicController = new PublicController();
