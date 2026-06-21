import { db } from "../../db";
import { ObjectId } from "mongodb";
import { githubService } from "../github/github.service";

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

    // Determine the repos to query: targetRepo if it exists, otherwise sourceRepos
    const reposToQuery = project.targetRepo ? [project.targetRepo] : (project.sourceRepos || []);

    const releasesPromises = reposToQuery.map(async (repoName: string) => {
      try {
        const repoReleases = await githubService.getRepoReleases(undefined, repoName);
        return repoReleases.map((r: any) => ({ ...r, sourceRepo: repoName }));
      } catch (error) {
        console.error(`Failed to fetch public releases for ${repoName}:`, error);
        return [];
      }
    });

    const results: any[] = await Promise.all(releasesPromises);

    // Fetch mappings for this project
    const mappings = await db.collections.releaseMappings.find({ projectId: new ObjectId(id) });
    const mappingMap = new Map(mappings.map(m => [m.sourceReleaseId, m]));

    let allReleases = results.flat().map(r => {
      const mapping = mappingMap.get(r.id.toString());
      return {
        ...r,
        status: mapping?.status || "draft",
        isCurrent: mapping?.isCurrent || false,
      };
    });

    // If pulling from sourceRepos (internal-only), filter out drafts
    if (!project.targetRepo) {
      allReleases = allReleases.filter(r => r.status === "public");
    }

    allReleases.sort((a, b) => {
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

  async updateReleaseMapping(projectId: string, sourceReleaseId: string, data: { status?: "draft" | "public", isCurrent?: boolean }) {
    if (data.isCurrent) {
      // If setting to current, unset isCurrent on all other mappings for this project
      const allMappings = await db.collections.releaseMappings.find({ projectId: new ObjectId(projectId) });
      for (const mapping of allMappings) {
        if (mapping.isCurrent && mapping.sourceReleaseId !== sourceReleaseId) {
          await db.collections.releaseMappings.updateOne({ _id: mapping._id }, { $set: { isCurrent: false } });
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

      await db.collections.releaseMappings.updateOne({ _id: existing._id }, { $set: updateData });
      return { ...existing, ...updateData };
    } else {
      const insertData = {
        projectId: new ObjectId(projectId),
        sourceReleaseId,
        status: data.status || "draft",
        isCurrent: data.isCurrent || false,
      };
      const result = await db.collections.releaseMappings.insertOne(insertData);
      return { _id: result._id, ...insertData };
    }
  }

  async createProject(data: { name: string; sourceRepos: string[]; targetRepo?: string | null }) {
    if (!data.name) {
      throw new Error("Missing required fields");
    }

    const result = await db.collections.projects.insertOne({
      name: data.name,
      sourceRepos: data.sourceRepos || [],
      targetRepo: data.targetRepo || null,
    });

    return { id: result._id, ...data };
  }
}

export const projectsService = new ProjectsService();
