import { command } from "commandstruct";

export const statusCmd = command("status")
  .describe("View project status")
  .action(() => {
    console.log("Current Channel   Production");
    console.log("Current Release   v2.1.0");
    console.log("Users             12,401");
    console.log("Adoption          82%");
    console.log("Crash Rate        0.08%");
  });
