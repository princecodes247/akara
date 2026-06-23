import { db } from "../../db";
import { ObjectId } from "mongodb";
import { githubService } from "../github/github.service";
import config from "../../lib/config";

export class ProjectsService {
  async getAllProjects() {
    return await db.collections.projects.find();
  }

  async getProjectById(id: string) {
    const project = await db.collections.projects.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  async getProjectReleases(id: string, githubToken: string) {
    const project = await this.getProjectById(id);
    const sourceRepos = project.sourceRepos || [];

    // Fetch releases for all source repos concurrently
    const releasesPromises = sourceRepos.map(async (repoName: string) => {
      try {
        const repoReleases = await githubService.getRepoReleases(githubToken, repoName);
        // Attach source repo name to each release for the UI
        return repoReleases.map((r: any) => ({ ...r, sourceRepo: repoName }));
      } catch (error) {
        console.error(`Failed to fetch releases for ${repoName}:`, error);
        return [];
      }
    });

    const results: any[] = await Promise.all(releasesPromises);

    // Fetch mappings for this project
    const mappings = await db.collections.releaseMappings.find({ projectId: new ObjectId(id) });
    const mappingMap = new Map(mappings.map(m => [m.sourceReleaseId, m]));

    // Flatten the array of arrays and merge mappings
    const allReleases = results.flat().map(r => {
      const mapping = mappingMap.get(r.id.toString());
      return {
        ...r,
        status: mapping?.status || "draft",
        isCurrent: mapping?.isCurrent || false,
        customTitle: mapping?.customTitle,
        customBody: mapping?.customBody,
        customAssets: mapping?.customAssets,
      };
    });

    // Sort by publishedAt descending
    allReleases.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return allReleases;
  }

  async getPublicProjectData(id: string) {
    const project = await this.getProjectById(id);

    // Fetch mappings for this project from the database
    const mappings = await db.collections.releaseMappings.find({ projectId: new ObjectId(id) });

    // Only return releases that are marked as public
    const publicMappings = mappings.filter((m: any) => m.status === "public");

    const allReleases = publicMappings.map((m: any) => {
      // Use the snapshot of the release data stored in the database
      const r = m.releaseData || { id: m.sourceReleaseId };

      // Determine assets list: use customAssets if populated, otherwise original assets
      const assetsList = m.customAssets && m.customAssets.length > 0 ? m.customAssets : (r.assets || []);

      // Rewrite asset URLs based on targetRepo or proxy
      const rewrittenAssets = assetsList.map((asset: any) => {
        if (project.targetRepo) {
          return {
            id: asset.id,
            name: asset.name,
            tag: asset.tag || "",
            url: `https://github.com/${project.targetRepo}/releases/download/${r.tag || r.tag_name}/${encodeURIComponent(asset.name)}`
          };
        } else {
          const assetSourceRepo = asset.sourceRepo || r.sourceRepo || "";
          const assetSourceReleaseId = asset.sourceReleaseId || m.sourceReleaseId;
          return {
            id: asset.id,
            name: asset.name,
            tag: asset.tag || "",
            url: `${config.BASE_URL}/api/public/projects/${id}/releases/${assetSourceReleaseId}/assets/${asset.id}?repo=${encodeURIComponent(assetSourceRepo)}`
          };
        }
      });

      return {
        ...r,
        title: m.customTitle || r.title || r.name || r.tag,
        body: m.customBody !== undefined ? m.customBody : (r.body || ""),
        assets: rewrittenAssets,
        status: m.status,
        isCurrent: m.isCurrent,
      };
    });

    allReleases.sort((a: any, b: any) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return {
      project: {
        id: project._id,
        name: project.name,
        targetRepo: project.targetRepo,
        sourceRepos: project.sourceRepos,
      },
      releases: allReleases,
    };
  }

  async getAssetDownloadUrl(projectId: string, releaseId: string, assetId: string, repoQueryParam?: string, bypassPublicCheck = false) {
    if (!bypassPublicCheck) {
      // 1. Verify the release mapping exists and is public
      const mapping = await db.collections.releaseMappings.findOne({
        projectId: new ObjectId(projectId),
        sourceReleaseId: releaseId,
        status: "public"
      });

      if (!mapping) {
        throw new Error("Asset not found or release is not public");
      }
    }

    // 2. Get the repo name. Either from the cached release data, or fallback to query param
    // If we bypass validation, the mapping may not exist or not be public, so we fetch it directly if present
    const mapping = await db.collections.releaseMappings.findOne({
      projectId: new ObjectId(projectId),
      sourceReleaseId: releaseId,
    });
    const repoFullName = (mapping?.releaseData as any)?.sourceRepo || repoQueryParam;

    if (!repoFullName) {
      throw new Error("Could not determine source repository for asset");
    }

    // 3. Get the pre-signed download URL from GitHub
    const project = await this.getProjectById(projectId);
    let token: string | undefined = undefined;
    if (project.userId) {
      const user = await db.collections.users.findById(project.userId.toString());
      if (user) {
        token = user.githubToken;
      }
    }
    return await githubService.getAssetDownloadUrl(repoFullName, assetId, token);
  }

  async promoteReleaseToTarget(projectId: string, sourceReleaseId: string, token: string) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project.targetRepo) return; // Nothing to do if no target repo

      const mapping = await db.collections.releaseMappings.findOne({
        projectId: new ObjectId(projectId),
        sourceReleaseId,
      });

      if (!mapping || !mapping.releaseData) return;

      const releaseData = mapping.releaseData as any;
      const targetRepo = project.targetRepo;

      // Check if release already exists on target repo
      const existingRelease = await githubService.getReleaseByTag(token, targetRepo, releaseData.tag || releaseData.tag_name) as any;
      
      if (existingRelease) {
        // Delete it to ensure a clean state
        await githubService.deleteRelease(token, targetRepo, existingRelease.id);
      }

      // Build customized release payload using custom staging fields if they exist
      const promoReleaseData = {
        tag: releaseData.tag || releaseData.tag_name,
        title: mapping.customTitle || releaseData.title || releaseData.name || releaseData.tag,
        body: mapping.customBody !== undefined ? mapping.customBody : (releaseData.body || ""),
        draft: false, // Target release is public
        prerelease: releaseData.prerelease || false,
      };

      // Create new release
      const newRelease = await githubService.createRelease(token, targetRepo, promoReleaseData) as any;

      // Determine assets to stream: use customAssets if defined, otherwise stream all source assets
      const assetsToUpload = mapping.customAssets && mapping.customAssets.length > 0
        ? mapping.customAssets
        : (releaseData.assets || []).map((asset: any) => ({
            id: asset.id,
            name: asset.name,
            sourceRepo: releaseData.sourceRepo,
            sourceReleaseId: sourceReleaseId,
          }));

      for (const asset of assetsToUpload) {
        const assetSourceRepo = asset.sourceRepo || releaseData.sourceRepo || "";
        const assetSourceReleaseId = asset.sourceReleaseId || sourceReleaseId;

        // Get the source download URL (bypass public check because we are in background sync)
        const sourceDownloadUrl = await this.getAssetDownloadUrl(
          projectId, 
          assetSourceReleaseId, 
          String(asset.id), 
          assetSourceRepo, 
          true
        );
        
        // Stream the asset directly from source to GitHub target using its custom name
        await githubService.streamAssetToGitHub(token, targetRepo, newRelease.id, asset.name, sourceDownloadUrl);
      }

      // Update mapping with the new targetReleaseId
      await db.collections.releaseMappings.updateOne(
        { _id: mapping._id },
        { $set: { targetReleaseId: String(newRelease.id) } }
      );
      console.log(`Successfully promoted release ${sourceReleaseId} to ${targetRepo}`);
    } catch (error) {
      console.error(`Failed to promote release ${sourceReleaseId} to target repo:`, error);
    }
  }

  async demoteReleaseFromTarget(projectId: string, sourceReleaseId: string, token: string) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project.targetRepo) return;

      const mapping = await db.collections.releaseMappings.findOne({
        projectId: new ObjectId(projectId),
        sourceReleaseId,
      });

      if (!mapping || !mapping.targetReleaseId) return;

      await githubService.deleteRelease(token, project.targetRepo, mapping.targetReleaseId);
      
      await db.collections.releaseMappings.updateOne(
        { _id: mapping._id },
        { $set: { targetReleaseId: null } }
      );
      console.log(`Successfully demoted release ${sourceReleaseId} from ${project.targetRepo}`);
    } catch (error) {
      console.error(`Failed to demote release ${sourceReleaseId}:`, error);
    }
  }

  async updateReleaseMapping(projectId: string, sourceReleaseId: string, data: { 
    status?: "draft" | "public", 
    isCurrent?: boolean, 
    releaseData?: any, 
    githubToken?: string,
    customTitle?: string,
    customBody?: string,
    customAssets?: any[]
  }) {
    if (data.isCurrent) {
      // If setting to current, unset isCurrent on all other mappings for this project
      const allMappings = await db.collections.releaseMappings.find({ projectId: new ObjectId(projectId) });
      for (const mapping of allMappings) {
        if (mapping.isCurrent && mapping.sourceReleaseId !== sourceReleaseId) {
          await db.collections.releaseMappings.updateOne({ _id: mapping._id }, { $set: { isCurrent: false } });
        }
      }
    }

    // Resolve token: use provided token, or fall back to retrieving from the project's owner
    let token = data.githubToken;
    if (!token) {
      const project = await this.getProjectById(projectId);
      if (project.userId) {
        const user = await db.collections.users.findById(project.userId.toString());
        if (user) {
          token = user.githubToken;
        }
      }
    }

    // Upsert the specific mapping
    const existing = await db.collections.releaseMappings.findOne({
      projectId: new ObjectId(projectId),
      sourceReleaseId,
    });

    if (existing) {
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isCurrent !== undefined) updateData.isCurrent = data.isCurrent;
      if (data.releaseData !== undefined) updateData.releaseData = data.releaseData;
      if (data.customTitle !== undefined) updateData.customTitle = data.customTitle;
      if (data.customBody !== undefined) updateData.customBody = data.customBody;
      if (data.customAssets !== undefined) updateData.customAssets = data.customAssets;

      await db.collections.releaseMappings.updateOne({ _id: existing._id }, { $set: updateData });
      
      // Trigger background sync if status changed or is explicitly public
      if (token) {
        if (data.status === "public") {
          this.promoteReleaseToTarget(projectId, sourceReleaseId, token).catch(console.error);
        } else if (data.status === "draft") {
          this.demoteReleaseFromTarget(projectId, sourceReleaseId, token).catch(console.error);
        }
      }

      return { ...existing, ...updateData };
    } else {
      const insertData: any = {
        projectId: new ObjectId(projectId),
        sourceReleaseId,
        status: data.status || "draft",
        isCurrent: data.isCurrent || false,
      };

      if (data.releaseData) {
        insertData.releaseData = data.releaseData;
      }
      if (data.customTitle !== undefined) insertData.customTitle = data.customTitle;
      if (data.customBody !== undefined) insertData.customBody = data.customBody;
      if (data.customAssets !== undefined) insertData.customAssets = data.customAssets;

      const result = await db.collections.releaseMappings.insertOne(insertData);
      
      if (insertData.status === "public" && token) {
        this.promoteReleaseToTarget(projectId, sourceReleaseId, token).catch(console.error);
      }

      return {
        _id: result._id,
        ...insertData,
      };
    }
  }

  async createProject(data: { name: string; sourceRepos: string[]; targetRepo?: string | null; githubId?: string }) {
    if (!data.name || !data.sourceRepos || data.sourceRepos.length === 0) {
      throw new Error("Missing required fields");
    }

    const insertData: any = {
      name: data.name,
      sourceRepos: data.sourceRepos,
      targetRepo: data.targetRepo || null,
    };

    if (data.githubId) {
      const user = await db.collections.users.findOne({ githubId: data.githubId });
      if (user) {
        insertData.userId = user._id;
      }
    }

    const result = await db.collections.projects.insertOne(insertData);
    return {
      _id: result._id,
      ...insertData,
    };
  }
}

export const projectsService = new ProjectsService();
