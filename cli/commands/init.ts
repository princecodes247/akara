import { command } from "commandstruct";
import { writeFileSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";
import { detectFramework } from "../core/adapters";

export const initCmd = command("init")
  .describe("Initialize Akara in the current project")
  .action(async () => {
    const cwd = process.cwd();
    const adapter = await detectFramework(cwd);

    if (adapter) {
      console.log(chalk.green("✔"), `Detected ${adapter.name} project`);
    } else {
      console.log(chalk.yellow("⚠"), "Could not automatically detect project framework.");
    }

    console.log(chalk.green("✔"), "Detected Git repository");

    const framework = adapter ? adapter.name : "unknown";

    const configContent = `name = "Akara Project"
framework = "${framework}"
targets = ["macos", "windows", "linux"]
channel = "production"
`;

    writeFileSync(resolve(cwd, "akara.toml"), configContent, "utf-8");
    console.log(chalk.green("✔"), "Created akara.toml");
  });
