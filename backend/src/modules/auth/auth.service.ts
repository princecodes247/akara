import jwt from "jsonwebtoken";
import config from "../../lib/config";
import { db, client } from "../../db";

interface GitHubTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  avatar_url: string;
  [key: string]: any; // Catch-all for other GitHub user properties
}

export class AuthService {
  private clientId = config.GITHUB_CLIENT_ID;
  private clientSecret = config.GITHUB_CLIENT_SECRET;
  private jwtSecret = config.JWT_SECRET;

  getGithubAuthUrl(): string {
    if (!this.clientId) {

      throw new Error("GitHub Client ID not configured");
    }
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&scope=repo`;
  }

  async handleGithubCallback(code: string): Promise<string> {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

    if (tokenData.error) {
      throw new Error(tokenData.error_description || "Unknown GitHub error");
    }

    const accessToken = tokenData.access_token;

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = (await userResponse.json()) as GitHubUserResponse;

    const payload = {
      userId: userData.id,
      username: userData.login,
      avatarUrl: userData.avatar_url,
    };

    // Find existing user or insert a new one (bypassing ORM upsert validation bug)
    const existingUser = await db.collections.users.findOne({ githubId: String(userData.id) });
    if (existingUser) {
      await db.collections.users.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            username: userData.login,
            githubToken: accessToken
          }
        }
      );
    } else {
      await db.collections.users.insertOne({
        githubId: String(userData.id),
        username: userData.login,
        githubToken: accessToken
      });
    }

    return jwt.sign(payload, this.jwtSecret, { expiresIn: "7d" });
  }
}

export const authService = new AuthService();
