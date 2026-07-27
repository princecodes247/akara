import { parse } from "smol-toml";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { ProjectConfig } from "./adapters/types";

export function loadConfig(dir: string): ProjectConfig | null {
  const configPath = resolve(dir, "akara.toml");
  if (!existsSync(configPath)) {
    return null;
  }
  const content = readFileSync(configPath, "utf-8");
  return parse(content) as unknown as ProjectConfig;
}
