import { TauriAdapter } from "./tauri";
import { ExpoAdapter } from "./expo";
import { ElectronAdapter } from "./electron";
import { FlutterAdapter } from "./flutter";
import type { FrameworkAdapter, Framework } from "./types";

export const adapters: FrameworkAdapter[] = [
  TauriAdapter,
  ExpoAdapter,
  ElectronAdapter,
  FlutterAdapter,
];

export async function detectFramework(dir: string): Promise<FrameworkAdapter | null> {
  for (const adapter of adapters) {
    const isMatch = await adapter.detect(dir);
    if (isMatch) {
      return adapter;
    }
  }
  return null;
}

export function getAdapter(framework: Framework): FrameworkAdapter | null {
  return adapters.find(a => a.name === framework) || null;
}
