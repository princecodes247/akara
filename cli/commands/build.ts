import { command, flag } from "commandstruct";

export const buildCmd = command("build")
  .describe("Build the project")
  .flags({
    cloud: flag("Use cloud build workers"),
  })
  .action(({ flags }) => {
    if (flags.cloud) {
      console.log("Building in the cloud...");
      console.log("- [x] Uploading project");
      console.log("- [x] Cloud worker: cargo tauri build");
    } else {
      console.log("Building locally...");
      console.log("- [x] cargo tauri build");
    }

    console.log("\nFound artifacts:");
    console.log("- [x] app.msi");
    console.log("- [x] app.app.tar.gz");
    console.log("- [x] app.appimage");
    console.log("\nDone");
  });
