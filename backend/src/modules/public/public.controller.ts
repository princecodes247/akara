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

function matchesPlatform(tag: string | undefined, requestedPlatform: string, assetName?: string): boolean {
  const t = (tag || "").toLowerCase().trim();
  const req = requestedPlatform.toLowerCase().trim();
  const name = (assetName || "").toLowerCase();

  if (t === req) return true;

  // Distinguish file extension types
  const isMacArchiveOrInstaller = name.endsWith(".dmg") || name.endsWith(".pkg") || name.includes(".app.tar.gz");
  const isWinArchiveOrInstaller = name.endsWith(".exe") || name.endsWith(".msi") || name.endsWith(".msi.zip") || name.endsWith(".nsis.zip");
  const isLinuxArchiveOrPackage = name.endsWith(".appimage") || name.endsWith(".appimage.tar.gz") || name.endsWith(".deb") || name.endsWith(".rpm");

  // Darwin / macOS
  const isDarwinReq = req === "darwin" || req === "macos" || req === "osx" || req.startsWith("darwin-") || req.startsWith("macos-");
  if (isDarwinReq) {
    // If it is explicitly a Windows or Linux package and not a mac archive/installer, it cannot be Darwin
    if ((isWinArchiveOrInstaller || isLinuxArchiveOrPackage) && !isMacArchiveOrInstaller) {
      return false;
    }

    const isTaggedMac = t.startsWith("darwin") || t.startsWith("macos");
    if (!isTaggedMac && !isMacArchiveOrInstaller) {
      return false;
    }

    // Generic darwin / macos matches any mac asset
    if (req === "darwin" || req === "macos" || req === "osx" || req === "darwin-universal" || req === "macos-universal") {
      return true;
    }

    const isDarwinAarch64 = req === "darwin-aarch64" || req === "macos-arm64" || req === "darwin-arm64";
    const isDarwinX86 = req === "darwin-x86_64" || req === "macos-x64" || req === "darwin-amd64";

    // Universal builds run on both architectures
    if (t.includes("universal") || name.includes("universal")) return true;

    if (isDarwinAarch64 && (t.includes("aarch64") || t.includes("arm64") || name.includes("aarch64") || name.includes("arm64"))) {
      return true;
    }

    if (isDarwinX86 && (t.includes("x86_64") || t.includes("x64") || name.includes("x86_64") || (name.includes("x64") && !name.includes("windows")))) {
      return true;
    }

    return false;
  }

  // Windows
  const isWinReq = req === "windows" || req === "win" || req.startsWith("windows-") || req.startsWith("win-");
  if (isWinReq) {
    if ((isMacArchiveOrInstaller || isLinuxArchiveOrPackage) && !isWinArchiveOrInstaller) {
      return false;
    }

    const isTaggedWin = t.startsWith("win");
    if (!isTaggedWin && !isWinArchiveOrInstaller) {
      return false;
    }

    if (req === "windows" || req === "win") {
      return true;
    }

    const isWinX64 = req === "windows-x86_64" || req === "windows-x64" || req === "win-x64";
    const isWinArm64 = req === "windows-arm64" || req === "win-arm64";

    if (isWinX64 && (t.includes("x86_64") || t.includes("x64") || name.includes("x64") || name.includes("x86_64"))) return true;
    if (isWinArm64 && (t.includes("arm64") || name.includes("arm64"))) return true;

    return false;
  }

  // Linux
  const isLinuxReq = req === "linux" || req.startsWith("linux-");
  if (isLinuxReq) {
    if ((isMacArchiveOrInstaller || isWinArchiveOrInstaller) && !isLinuxArchiveOrPackage) {
      return false;
    }

    const isTaggedLinux = t.startsWith("linux");
    if (!isTaggedLinux && !isLinuxArchiveOrPackage) {
      return false;
    }

    if (req === "linux") {
      return true;
    }

    const isLinuxX64 = req === "linux-x86_64" || req === "linux-x64" || req === "linux-amd64";
    const isLinuxArm64 = req === "linux-aarch64" || req === "linux-arm64";

    if (isLinuxX64 && (t.includes("x86_64") || t.includes("x64") || t.includes("amd64") || name.includes("amd64") || name.includes("x86_64"))) return true;
    if (isLinuxArm64 && (t.includes("aarch64") || t.includes("arm64") || name.includes("arm64") || name.includes("aarch64"))) return true;

    return false;
  }

  return false;
}

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

      // Identify framework adapter
      const framework = ((req.query.framework as string) || "tauri").toLowerCase();

      // Find all assets matching the requested platform
      const assets = currentRelease.assets || [];
      const matchingAssets = assets.filter((a: any) => matchesPlatform(a.tag, platform, a.name));

      // Prioritize the best asset for updates:
      // For Tauri, updater packages must be archives (.app.tar.gz for mac, .msi.zip/.nsis.zip for win, .appimage.tar.gz for linux)
      let platformAsset = matchingAssets.find((a: any) => {
        const n = (a.name || "").toLowerCase();
        const isTauriArchive = n.includes(".app.tar.gz") || n.endsWith(".nsis.zip") || n.endsWith(".msi.zip") || n.endsWith(".appimage.tar.gz");
        return framework === "tauri" ? (isTauriArchive && !!a.signature) : !!a.signature;
      }) || matchingAssets.find((a: any) => {
        const n = (a.name || "").toLowerCase();
        const isTauriArchive = n.includes(".app.tar.gz") || n.endsWith(".nsis.zip") || n.endsWith(".msi.zip") || n.endsWith(".appimage.tar.gz");
        return framework === "tauri" ? isTauriArchive : false;
      }) || matchingAssets.find((a: any) => !!a.signature) || matchingAssets[0];

      let signature: string | null = platformAsset?.signature?.trim() || null;

      // 1. If no signature directly on asset, check latest.json
      const latestJsonAsset = assets.find((a: any) => a.name === "latest.json");
      if (!signature && latestJsonAsset && latestJsonAsset.url) {
        try {
          const manifestRes = await fetch(latestJsonAsset.url);
          if (manifestRes.ok) {
            const manifest = (await manifestRes.json()) as any;
            if (manifest.platforms && typeof manifest.platforms === "object") {
              let platData = manifest.platforms[platform];
              if (!platData) {
                if (platform === "darwin" || platform === "macos" || platform === "osx" || platform === "darwin-aarch64" || platform === "darwin-x86_64") {
                  platData = manifest.platforms["darwin-aarch64"] || manifest.platforms["darwin-x86_64"] || manifest.platforms["darwin-universal"];
                } else if (platform === "windows" || platform === "win" || platform === "windows-x86_64") {
                  platData = manifest.platforms["windows-x86_64"] || manifest.platforms["windows-x64"];
                } else if (platform === "linux" || platform === "linux-x86_64") {
                  platData = manifest.platforms["linux-x86_64"] || manifest.platforms["linux-amd64"];
                }
              }

              if (platData?.signature) {
                signature = platData.signature.trim();
                if (!platformAsset) {
                  const fileName = decodeURIComponent(platData.url.substring(platData.url.lastIndexOf("/") + 1));
                  const matchingAsset = assets.find((a: any) => a.name === fileName);
                  platformAsset = matchingAsset || {
                    name: fileName,
                    url: platData.url,
                    tag: platform,
                    signature: signature
                  };
                }
              }
            }
          }
        } catch (e) {
          console.error("Error fetching/parsing latest.json manifest:", e);
        }
      }

      // 2. If still no signature, look for matching .sig file in assets
      if (!signature && platformAsset) {
        const sigAsset = assets.find((a: any) => {
          if (a.name === `${platformAsset.name}.sig`) return true;
          if (platformAsset.name.endsWith(".sig")) return false;
          if ((platform.startsWith("darwin") || platform === "darwin" || platform === "macos" || platformAsset.name.includes("universal")) && a.name.includes("universal") && a.name.endsWith(".sig")) {
            return true;
          }
          return false;
        });

        if (sigAsset && sigAsset.url) {
          try {
            const sigRes = await fetch(sigAsset.url);
            if (sigRes.ok) {
              signature = (await sigRes.text()).trim();
            } else {
              console.error(`Failed to fetch signature from ${sigAsset.url}: ${sigRes.status} ${sigRes.statusText}`);
            }
          } catch (e) {
            console.error("Error fetching signature file:", e);
          }
        }
      }

      if (!platformAsset) {
        return res.status(204).send(); // No update for this specific platform
      }

      if (!signature) {
        console.warn(`No signature found for platform ${platform}. Refusing to serve update.`);
        return res.status(204).send(); // No signature -> no update
      }

      let responsePayload: any;

      if (framework === "tauri") {
        responsePayload = {
          version: releaseVersion || currentRelease.tag,
          notes: currentRelease.body || currentRelease.title,
          pub_date: currentRelease.publishedAt || new Date().toISOString(),
          url: platformAsset.url,
          signature: signature,
          platforms: {
            [platform]: {
              signature: signature,
              url: platformAsset.url
            }
          }
        };
      } else if (framework === "electron") {
        responsePayload = {
          url: platformAsset.url,
          name: currentRelease.title || currentRelease.tag,
          notes: currentRelease.body,
          pub_date: currentRelease.publishedAt || new Date().toISOString(),
          version: releaseVersion || currentRelease.tag,
        };
      } else {
        responsePayload = {
          version: releaseVersion || currentRelease.tag,
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
              const metadata = await metaRes.json() as any;
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

  async registerStoreRelease(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const body = req.body;

      if (!body || !body.version) {
        return res.status(400).json({ error: "Missing required 'version' parameter." });
      }

      const release = await projectsService.createStoreRelease(id, body);
      res.status(201).json(release);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getStoreReleases(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const releases = await projectsService.getStoreReleases(id);
      res.json(releases);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getDesktopOtaUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, currentSequence } = req.params as { id: string; currentSequence: string };
      const clientSeq = parseInt(currentSequence, 10) || 0;
      const binaryVersion = (req.query.binary_version as string) || "";
      const platform = (req.query.platform as string) || "";
      const channel = (req.query.channel as string) || "production";

      const currentRelease = await getCachedCurrentRelease(id);
      if (!currentRelease) {
        return res.status(204).send();
      }

      const assets = currentRelease.assets || [];

      // Look for frontend OTA asset
      const otaAsset = assets.find((a: any) => {
        const name = (a.name || "").toLowerCase();
        return (
          name === "frontend.tar.gz" ||
          name === "bundle.tar.gz" ||
          name === "dist.tar.gz" ||
          name.endsWith("-frontend.tar.gz") ||
          name.endsWith("-ota.tar.gz") ||
          (a.tag === "ota" && (name.endsWith(".tar.gz") || name.endsWith(".zip")))
        );
      });

      if (!otaAsset) {
        return res.status(204).send();
      }

      // Calculate release sequence
      let releaseSeq = typeof currentRelease.sequence === "number" ? currentRelease.sequence : 0;
      if (!releaseSeq) {
        const match = (currentRelease.tag || "").match(/ota[.-](\d+)/i);
        if (match) {
          releaseSeq = parseInt(match[1], 10);
        } else {
          const pubDate = new Date(currentRelease.publishedAt || currentRelease.createdAt || Date.now());
          releaseSeq = Math.floor(pubDate.getTime() / 1000);
        }
      }

      if (releaseSeq <= clientSeq) {
        return res.status(204).send();
      }

      // Check min_binary_version
      const releaseVersion = semver.coerce(currentRelease.tag)?.version || "0.0.0";
      const minBinaryVersion = (currentRelease.minBinaryVersion as string) || releaseVersion;
      if (binaryVersion && minBinaryVersion) {
        const clientBin = semver.coerce(binaryVersion)?.version;
        const minBin = semver.coerce(minBinaryVersion)?.version;
        if (clientBin && minBin && semver.lt(clientBin, minBin)) {
          return res.status(204).send();
        }
      }

      // Resolve signature
      let signature = otaAsset.signature?.trim() || null;
      if (!signature) {
        const sigAsset = assets.find(
          (a: any) =>
            a.name === `${otaAsset.name}.sig` ||
            (a.name.endsWith(".sig") && a.name.includes("frontend"))
        );
        if (sigAsset && sigAsset.url) {
          try {
            const sigRes = await fetch(sigAsset.url);
            if (sigRes.ok) {
              signature = (await sigRes.text()).trim();
            }
          } catch (e) {
            console.error("Error fetching OTA signature file:", e);
          }
        }
      }

      if (!signature) {
        console.warn(`No signature found for OTA asset ${otaAsset.name}. Refusing to serve unsigned update.`);
        return res.status(204).send();
      }

      const responsePayload = {
        version: currentRelease.tag || `${releaseVersion}-ota.${releaseSeq}`,
        sequence: releaseSeq,
        min_binary_version: minBinaryVersion,
        url: otaAsset.url,
        signature: signature,
        notes: currentRelease.body || currentRelease.title || "OTA frontend update",
        pub_date: currentRelease.publishedAt || new Date().toISOString(),
        mandatory: false,
        bundle_size: otaAsset.size || undefined,
      };

      return res.json(responsePayload);
    } catch (error: any) {
      if (error.message === "Project not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const publicController = new PublicController();
