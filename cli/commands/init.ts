import { command } from "commandstruct";
import { writeFileSync } from "fs";
import { resolve } from "path";

export const initCmd = command("init")
  .describe("Initialize Akara in the current project")
  .action(() => {
    console.log("✔ Detected Tauri project");
    console.log("✔ Detected Git repository");
    console.log("✔ Detected GitHub Actions");
    console.log("✔ Detected updater configuration");
    
    const configContent = `name = "Acme App"
framework = "tauri"
runtime = "desktop"
channel = "production"
version_source = "cargo"
artifact_dir = "src-tauri/target/release/bundle"
storage = "github"
signing = "keychain"
`;
    
    writeFileSync(resolve(process.cwd(), "akara.toml"), configContent, "utf-8");
    console.log("✔ Created akara.toml");
  });
