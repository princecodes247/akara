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

    const data = (await response.json()) as any;
    return data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
    }));
  }

  async getRepoReleases(githubToken: string | undefined, repoFullName: string) {
    const token = githubToken || process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases?per_page=20`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
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

  async getAssetDownloadUrl(repoFullName: string, assetId: string, githubToken?: string): Promise<string> {
    const headers: Record<string, string> = {
      Accept: "application/octet-stream",
    };
    
    const token = githubToken || process.env.GITHUB_TOKEN;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use redirect: "manual" to intercept the 302 Found response
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases/assets/${assetId}`, {
      headers,
      redirect: "manual",
    });

    if (response.status === 302) {
      const location = response.headers.get("location");
      if (location) {
        return location;
      }
    }

    // If it's 200, maybe it didn't redirect or it streamed directly? (Unlikely for GitHub assets)
    if (response.ok && response.status === 200) {
      // In case fetch follows the redirect anyway (some runtimes do despite 'manual'), we just return the final URL
      return response.url;
    }

    throw new Error(`Failed to get asset download URL. Status: ${response.status} ${response.statusText}`);
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
      const err = (await response.json()) as any;
      throw new Error(`Failed to create repository on GitHub: ${err.message}`);
    }
  }

  async getReleaseByTag(githubToken: string, repoFullName: string, tag: string) {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases/tags/${tag}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to get release by tag: ${response.statusText}`);

    return await response.json();
  }

  async createRelease(githubToken: string, repoFullName: string, releaseData: any) {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag_name: releaseData.tag,
        name: releaseData.title,
        body: releaseData.body,
        draft: releaseData.draft || false,
        prerelease: releaseData.prerelease || false,
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as any;
      throw new Error(`Failed to create release: ${err.message}`);
    }

    return await response.json();
  }

  async deleteRelease(githubToken: string, repoFullName: string, releaseId: string | number) {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/releases/${releaseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete release: ${response.statusText}`);
    }
  }

  async streamAssetToGitHub(githubToken: string, targetRepo: string, releaseId: string | number, assetName: string, sourceDownloadUrl: string) {
    // 1. Get the stream from source
    const sourceResponse = await fetch(sourceDownloadUrl, {
      headers: {
        // No auth header needed here because the presigned URL is already authenticated
      }
    });

    if (!sourceResponse.ok || !sourceResponse.body) {
      throw new Error(`Failed to download source asset: ${sourceResponse.statusText}`);
    }

    const contentLength = sourceResponse.headers.get("content-length");
    const contentType = sourceResponse.headers.get("content-type") || "application/octet-stream";

    // 2. Stream to GitHub Upload API
    const uploadUrl = `https://uploads.github.com/repos/${targetRepo}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`;
    
    const headers: Record<string, string> = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": contentType,
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: sourceResponse.body,
      // @ts-ignore - duplex is required for streaming body in fetch, but TS types might not have it
      duplex: "half", 
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Failed to upload asset to GitHub: ${errText}`);
    }

    return await uploadResponse.json();
  }
}

export const githubService = new GithubService();
