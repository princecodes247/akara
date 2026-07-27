import Redis from "ioredis";
import config from "../../lib/config";
import crypto from "crypto";

export class DeviceAuthService {
  private redis: Redis;
  private EXPIRATION_SECONDS = 10 * 60; // 10 minutes

  constructor() {
    this.redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  async createDeviceCode(): Promise<string> {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    await this.redis.set(`device_auth:${code}`, "pending", "EX", this.EXPIRATION_SECONDS);
    return code;
  }

  async verifyDeviceCode(code: string, token: string): Promise<boolean> {
    const status = await this.redis.get(`device_auth:${code}`);
    if (!status || status !== "pending") {
      return false;
    }
    // Store the token and set expiration to a short window (e.g., 2 minutes) for the CLI to pick it up
    await this.redis.set(`device_auth:${code}`, JSON.stringify({ status: "success", token }), "EX", 120);
    return true;
  }

  async checkDeviceCodeStatus(code: string): Promise<{ status: string; token?: string }> {
    const result = await this.redis.get(`device_auth:${code}`);
    if (!result) {
      return { status: "expired" };
    }
    if (result === "pending") {
      return { status: "pending" };
    }
    try {
      const data = JSON.parse(result);
      return data;
    } catch {
      return { status: "expired" };
    }
  }
}

export const deviceAuthService = new DeviceAuthService();
