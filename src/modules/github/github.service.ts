export class GithubService {
  async getUserRepos(githubToken: string) {
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
    }));
  }

  async getRepoReleases(githubToken: string | undefined, repoFullName: string) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    
    const token = githubToken || process.env.GITHUB_TOKEN;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases?per_page=20`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((release: any) => ({
      id: release.id,
      tag: release.tag_name,
      title: release.name,
      body: release.body,
      draft: release.draft,
      prerelease: release.prerelease,
      publishedAt: release.published_at,
      url: release.html_url,
      assets: release.assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        downloadCount: asset.download_count,
        url: asset.browser_download_url,
      })),
    }));
  }

  async checkRepoExists(githubToken: string, repoFullName: string): Promise<boolean> {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return response.ok;
  }

  async createRepo(githubToken: string, username: string, repoFullName: string): Promise<void> {
    const parts = repoFullName.split("/");
    if (parts.length !== 2) {
      throw new Error("Invalid repository format. Expected owner/name");
    }
    
    const owner = parts[0];
    const name = parts[1];
    
    // Determine if creating under personal account or an organization
    const isOrg = owner !== username;
    const url = isOrg 
      ? `https://api.github.com/orgs/${owner}/repos`
      : `https://api.github.com/user/repos`;
      
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        private: false, // Target release repo should be public by default as per PRD
        description: "Akara Target Release Repository",
        auto_init: true // Initialize with README so it can be cloned/used immediately
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Failed to create repository on GitHub: ${err.message}`);
    }
  }
}

export const githubService = new GithubService();
