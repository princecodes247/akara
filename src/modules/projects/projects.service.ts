import { db } from "../../db";

export class ProjectsService {
  async getAllProjects() {
    return await db.collections.projects.find();
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
