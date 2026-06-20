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

  async getRepoReleases(githubToken: string, repoFullName: string) {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases?per_page=20`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
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
}

export const githubService = new GithubService();
