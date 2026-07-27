export type Framework = "tauri" | "expo" | "electron" | "flutter" | "capacitor" | "react-native" | "unknown";
export type Target = "macos" | "windows" | "linux" | "ios" | "android";

export interface ProjectConfig {
  name: string;
  framework: Framework;
  targets: Target[];
  runtime?: string;
  channel?: string;
  version_source?: string;
  artifact_dir?: string;
  storage?: string;
  signing?: string;
}

export interface FrameworkAdapter {
  name: Framework;
  detect(dir: string): boolean | Promise<boolean>;
  buildLocal(dir: string, config: ProjectConfig): Promise<void>;
  getArtifacts(dir: string, config: ProjectConfig): Promise<string[]>;
}
