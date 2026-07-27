import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { FrameworkAdapter } from "./types";
import { exec, spawn } from "child_process";

export const TauriAdapter: FrameworkAdapter = {
  name: "tauri",
  detect: (dir) => {
    return existsSync(resolve(dir, "src-tauri/tauri.conf.json"));
  },
  verifyTools: async () => {
    return new Promise((resolve, reject) => {
      exec("cargo tauri --version", (error: any) => {
        if (error) reject(new Error("cargo or tauri-cli is not installed. Please install Rust and tauri-cli (cargo install tauri-cli)."));
        else resolve();
      });
    });
  },
  buildLocal: async (dir, config) => {
    return new Promise((resolve, reject) => {
      console.log(`Building Tauri project for targets: ${config.targets.join(", ")}`);
      // Simulating a cargo tauri build spawn
      const p = spawn("cargo", ["tauri", "build"], { cwd: dir, stdio: "inherit" });
      p.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`cargo tauri build exited with code ${code}`));
      });
      p.on("error", (err) => {
        console.error("Failed to start cargo tauri build. Is cargo and tauri-cli installed?");
        reject(err);
      });
    });
  },
  getArtifacts: async (dir, config) => {
    // Basic mock implementation of finding artifacts
    return ["src-tauri/target/release/bundle/macos/app.app.tar.gz"];
  }
};
