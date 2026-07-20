export const queryKeys = {
  projects: {
    all: () => ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  releases: {
    list: (projectId: string) => ["projects", projectId, "releases"] as const,
    detail: (projectId: string, releaseId: string) => ["projects", projectId, "releases", releaseId] as const,
  },
  github: {
    repos: () => ["github", "repos"] as const,
  },
};
