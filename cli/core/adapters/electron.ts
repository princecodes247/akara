import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { FrameworkAdapter } from "./types";
import { spawn } from "child_process";

export const ElectronAdapter: FrameworkAdapter = {
  name: "electron",
  detect: (dir) => {
    if (!existsSync(resolve(dir, "package.json"))) return false;
    try {
      const pkg = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf-8"));
      return !!(pkg.dependencies?.electron || pkg.devDependencies?.electron);
    } catch {
      return false;
    }
  },
  buildLocal: async (dir, config) => {
    return new Promise((resolve, reject) => {
      console.log(`Building Electron project for targets: ${config.targets.join(", ")}`);
      const p = spawn("npx", ["electron-builder"], { cwd: dir, stdio: "inherit" });
      p.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`electron-builder exited with code ${code}`));
      });
      p.on("error", (err) => reject(err));
    });
  },
  getArtifacts: async (dir, config) => {
    return ["dist/app.dmg", "dist/app.exe"];
  }
};
