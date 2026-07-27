import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { FrameworkAdapter } from "./types";
import { spawn } from "child_process";

export const ExpoAdapter: FrameworkAdapter = {
  name: "expo",
  detect: (dir) => {
    if (!existsSync(resolve(dir, "app.json"))) return false;
    try {
      const appJson = JSON.parse(readFileSync(resolve(dir, "app.json"), "utf-8"));
      return !!appJson.expo;
    } catch {
      return false;
    }
  },
  buildLocal: async (dir, config) => {
    return new Promise((resolve, reject) => {
      console.log(`Building Expo project for targets: ${config.targets.join(", ")}`);
      const p = spawn("npx", ["eas-cli", "build", "--local"], { cwd: dir, stdio: "inherit" });
      p.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`eas build exited with code ${code}`));
      });
      p.on("error", (err) => {
        console.error("Failed to start eas build.");
        reject(err);
      });
    });
  },
  getArtifacts: async (dir, config) => {
    return ["build/app.apk", "build/app.ipa"];
  }
};
