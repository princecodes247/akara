import { existsSync } from "fs";
import { resolve } from "path";
import type { FrameworkAdapter } from "./types";
import { spawn } from "child_process";

export const FlutterAdapter: FrameworkAdapter = {
  name: "flutter",
  detect: (dir) => {
    return existsSync(resolve(dir, "pubspec.yaml"));
  },
  buildLocal: async (dir, config) => {
    return new Promise((resolve, reject) => {
      console.log(`Building Flutter project for targets: ${config.targets.join(", ")}`);
      // Simulating build for all targets sequentially or concurrently
      // For now just spawning 'flutter build apk' as a placeholder
      const p = spawn("flutter", ["build", "apk"], { cwd: dir, stdio: "inherit" });
      p.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`flutter build exited with code ${code}`));
      });
      p.on("error", (err) => reject(err));
    });
  },
  getArtifacts: async (dir, config) => {
    return ["build/app/outputs/flutter-apk/app-release.apk"];
  }
};
