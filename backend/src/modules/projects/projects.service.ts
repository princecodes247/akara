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

    // Fetch staged releases for this project
    const staged = await db.collections.stagedReleases.find({ projectId: new ObjectId(id) });
    const stagedMap = new Map(staged.map(s => [s.sourceReleaseId, s]));

    // Flatten the array of arrays and merge staging data
    const allReleases = results.flat().map(r => {
      const stage = stagedMap.get(r.id.toString());
      return {
        ...r,
        status: stage?.status || "draft",
        isCurrent: stage?.isCurrent || false,
        customTitle: stage?.title,
        customBody: stage?.body,
        customAssets: stage?.assets,
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

  formatPublicRelease(project: any, s: any, projectId: string) {
    // Use the snapshot of the release data stored in the database
    const r = s.releaseData || { id: s.sourceReleaseId };

    // Determine assets list: use custom assets if populated, otherwise original assets
    const assetsList = s.assets && s.assets.length > 0 ? s.assets : (r.assets || []);

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
        const assetSourceReleaseId = asset.sourceReleaseId || s.sourceReleaseId;
        return {
          id: asset.id,
          name: asset.name,
          tag: asset.tag || "",
          url: `${config.BASE_URL}/api/public/projects/${projectId}/releases/${assetSourceReleaseId}/assets/${asset.id}?repo=${encodeURIComponent(assetSourceRepo)}`
        };
      }
    });

    return {
      ...r,
      title: s.title || r.title || r.name || r.tag,
      body: s.body !== undefined ? s.body : (r.body || ""),
      assets: rewrittenAssets,
      status: s.status,
      isCurrent: s.isCurrent,
    };
  }

  async getPublicProjectData(id: string) {
    const project = await this.getProjectById(id);

    // Fetch staged releases for this project from the database
    const staged = await db.collections.stagedReleases.find({ projectId: new ObjectId(id) });

    // Only return releases that are marked as public
    const publicStaged = staged.filter((s: any) => s.status === "public");

    const allReleases = publicStaged.map((s: any) => this.formatPublicRelease(project, s, id));

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

  async getCurrentRelease(id: string) {
    const project = await this.getProjectById(id);

    // Fetch staged releases for this project from the database
    const staged = await db.collections.stagedReleases.find({ 
      projectId: new ObjectId(id),
      status: "public"
    });

    if (staged.length === 0) return null;

    // Find the one marked as current
    let current = staged.find((s: any) => s.isCurrent);
    
    // Fallback: if none is explicitly marked current, use the newest one by publication date
    if (!current) {
      staged.sort((a: any, b: any) => {
        const dateA = a.releaseData?.publishedAt ? new Date(a.releaseData.publishedAt).getTime() : 0;
        const dateB = b.releaseData?.publishedAt ? new Date(b.releaseData.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
      current = staged[0];
    }

    return this.formatPublicRelease(project, current, id);
  }

  async getAssetDownloadUrl(projectId: string, releaseId: string, assetId: string, repoQueryParam?: string, bypassPublicCheck = false) {
    if (!bypassPublicCheck) {
      // 1. Verify the staged release exists and is public
      const stage = await db.collections.stagedReleases.findOne({
        projectId: new ObjectId(projectId),
        sourceReleaseId: releaseId,
        status: "public"
      });

      if (!stage) {
        throw new Error("Asset not found or release is not public");
      }
    }

    // 2. Get the repo name. Either from the cached release data, or fallback to query param
    // If we bypass validation, the stage may not exist or not be public, so we fetch it directly if present
    const stage = await db.collections.stagedReleases.findOne({
      projectId: new ObjectId(projectId),
      sourceReleaseId: releaseId,
    });
    const repoFullName = (stage?.releaseData as any)?.sourceRepo || repoQueryParam;

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

      const stage = await db.collections.stagedReleases.findOne({
        projectId: new ObjectId(projectId),
        sourceReleaseId,
      });

      if (!stage || !stage.releaseData) return;

      const releaseData = stage.releaseData as any;
      const targetRepo = project.targetRepo;

      // Check if release already exists on target repo
      const existingRelease = await githubService.getReleaseByTag(token, targetRepo, releaseData.tag || releaseData.tag_name) as any;
      
      if (existingRelease) {
        // Delete it to ensure a clean state
        await githubService.deleteRelease(token, targetRepo, existingRelease.id);
      }

      // Build customized release payload using custom staging fields if they exist
      const promoReleaseData = {
        tag: stage.tag || releaseData.tag || releaseData.tag_name,
        title: stage.title || releaseData.title || releaseData.name || releaseData.tag,
        body: stage.body !== undefined ? stage.body : (releaseData.body || ""),
        draft: false, // Target release is public
        prerelease: releaseData.prerelease || false,
      };

      // Create new release
      const newRelease = await githubService.createRelease(token, targetRepo, promoReleaseData) as any;

      // Determine assets to stream: use custom assets if defined, otherwise stream all source assets
      const assetsToUpload = stage.assets && stage.assets.length > 0
        ? stage.assets
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

      // Update staged release with the new targetReleaseId
      await db.collections.stagedReleases.updateOne(
        { _id: stage._id },
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

      const stage = await db.collections.stagedReleases.findOne({
        projectId: new ObjectId(projectId),
        sourceReleaseId,
      });

      if (!stage || !stage.targetReleaseId) return;

      await githubService.deleteRelease(token, project.targetRepo, stage.targetReleaseId);
      
      await db.collections.stagedReleases.updateOne(
        { _id: stage._id },
        { $set: { targetReleaseId: null } }
      );
      console.log(`Successfully demoted release ${sourceReleaseId} from ${project.targetRepo}`);
    } catch (error) {
      console.error(`Failed to demote release ${sourceReleaseId}:`, error);
    }
  }

  async deleteStagedRelease(projectId: string, sourceReleaseId: string) {
    const stage = await db.collections.stagedReleases.findOne({
      projectId: new ObjectId(projectId),
      sourceReleaseId,
    });

    if (!stage) return;

    // If it was published (public), delete the release on GitHub first
    if (stage.status === "public" && stage.targetReleaseId) {
      // Find the user to resolve their token
      const project = await this.getProjectById(projectId);
      if (project.userId && project.targetRepo) {
        const user = await db.collections.users.findById(project.userId.toString());
        if (user) {
          await githubService.deleteRelease(user.githubToken, project.targetRepo, stage.targetReleaseId).catch(console.error);
        }
      }
    }

    // Delete the staged release record from the database
    await db.collections.stagedReleases.deleteOne({ _id: stage._id });
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
      // If setting to current, unset isCurrent on all other staged releases for this project
      const allStaged = await db.collections.stagedReleases.find({ projectId: new ObjectId(projectId) });
      for (const stage of allStaged) {
        if (stage.isCurrent && stage.sourceReleaseId !== sourceReleaseId) {
          await db.collections.stagedReleases.updateOne({ _id: stage._id }, { $set: { isCurrent: false } });
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

    // Upsert the specific staged release document
    const existing = await db.collections.stagedReleases.findOne({
      projectId: new ObjectId(projectId),
      sourceReleaseId,
    });

    if (existing) {
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isCurrent !== undefined) updateData.isCurrent = data.isCurrent;
      if (data.releaseData !== undefined) updateData.releaseData = data.releaseData;
      if (data.customTitle !== undefined) updateData.title = data.customTitle;
      if (data.customBody !== undefined) updateData.body = data.customBody;
      if (data.customAssets !== undefined) updateData.assets = data.customAssets;

      await db.collections.stagedReleases.updateOne({ _id: existing._id }, { $set: updateData });
      
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
        tag: data.releaseData?.tag || data.releaseData?.tag_name || "",
        title: data.customTitle || data.releaseData?.title || data.releaseData?.name || "",
        body: data.customBody || data.releaseData?.body || "",
        assets: data.customAssets || [],
        status: data.status || "draft",
        isCurrent: data.isCurrent || false,
        targetReleaseId: null,
      };

      if (data.releaseData) {
        insertData.releaseData = data.releaseData;
      }

      const result = await db.collections.stagedReleases.insertOne(insertData);
      
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

  async updateProject(id: string, data: { name: string; sourceRepos?: string[]; targetRepo?: string | null }) {
    if (!data.name) {
      throw new Error("Missing required fields");
    }

    const updateObj: any = {
      name: data.name
    };

    if (data.sourceRepos !== undefined) {
      updateObj.sourceRepos = data.sourceRepos;
    }

    if (data.targetRepo !== undefined) {
      updateObj.targetRepo = data.targetRepo;
    }

    const result = await db.collections.projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateObj }
    );

    if (result.matchedCount === 0) {
      throw new Error("Project not found");
    }

    return { success: true };
  }

  async deleteProject(id: string) {
    const projectId = new ObjectId(id);

    // Delete the project document
    const result = await db.collections.projects.deleteOne({ _id: projectId });
    if (result.deletedCount === 0) {
      throw new Error("Project not found");
    }

    // Delete stagedReleases associated with this project
    await db.collections.stagedReleases.deleteMany({ projectId });

    // Delete releaseMappings associated with this project
    await db.collections.releaseMappings.deleteMany({ projectId });

    return { success: true };
  }
}

export const projectsService = new ProjectsService();
