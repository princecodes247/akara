import { command, flag } from "commandstruct";
import chalk from "chalk";
import { loadConfig } from "../core/config";
import { getAdapter } from "../core/adapters";

export const buildCmd = command("build")
  .describe("Build the project")
  .flags({
    local: flag("Use local build tools instead of cloud"),
  })
  .action(async ({ flags }) => {
    const cwd = process.cwd();
    const config = loadConfig(cwd);

    if (!config) {
      console.log(chalk.red("✖"), "No akara.toml found. Run `akara init` first.");
      process.exit(1);
    }

    if (!flags.local) {
      console.log(chalk.blue("i"), "Building in the cloud...");
      console.log("- [x] Uploading project");
      console.log(`- [x] Cloud worker: building ${config.framework} for ${config.targets?.join(', ')}`);
      console.log("\\nCloud building is not implemented yet. Use --local to build locally.");
      return;
    }

    const adapter = getAdapter(config.framework);
    if (!adapter) {
      console.log(chalk.red("✖"), `Framework adapter '${config.framework}' not found.`);
      process.exit(1);
    }

    console.log(chalk.blue("i"), `Building locally using ${adapter.name} adapter...`);
    try {
      await adapter.buildLocal(cwd, config);
      console.log(chalk.green("✔"), "Build completed successfully.");

      const artifacts = await adapter.getArtifacts(cwd, config);
      console.log("\\nFound artifacts:");
      artifacts.forEach(a => console.log(`- [x] ${a}`));
      console.log("\\nDone");
    } catch (err: any) {
      console.log(chalk.red("✖"), "Build failed:", err.message);
      process.exit(1);
    }
  });
