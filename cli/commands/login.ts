import { command, flag } from "commandstruct";
import open from "open";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";

const API_URL = process.env.AKARA_API_URL || "http://localhost:4000/v1";

const saveConfig = (token: string) => {
  const configDir = path.join(os.homedir(), ".akara");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(path.join(configDir, "config.json"), JSON.stringify({ token }, null, 2));
};

export const loginCmd = command("login")
  .describe("Login to Akara via browser")
  .flags({
    token: flag("Authentication token (bypasses browser login)").optionalParam("string"),
  })
  .action(async ({ flags }) => {
    if (flags.token) {
      saveConfig(flags.token);
      console.log(chalk.green("✔"), "Successfully logged in with provided token.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/device/code`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to initialize login flow");
      const { deviceCode, verificationUri } = await res.json();

      const loginUrl = `${verificationUri}?code=${deviceCode}`;

      console.log(`\nYour device authentication code is: ${chalk.bold.cyan(deviceCode)}\n`);
      console.log(`Opening browser to: ${loginUrl}`);
      console.log(`Waiting for authentication... (Press Ctrl+C to cancel)`);

      try {
        await open(loginUrl);
      } catch (e) {
        console.log(chalk.yellow("Could not open browser automatically. Please open the URL manually."));
      }

      // Polling loop
      const maxAttempts = 300; // 10 minutes at 2s interval
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;

        const statusRes = await fetch(`${API_URL}/auth/device/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: deviceCode }),
        });

        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();

        if (statusData.status === "success") {
          saveConfig(statusData.token);
          console.log(chalk.green("✔"), "Successfully logged in!");
          return;
        } else if (statusData.status === "expired") {
          console.log(chalk.red("✖"), "Device code expired. Please run login again.");
          process.exit(1);
        }
      }

      console.log(chalk.red("✖"), "Login timed out.");
      process.exit(1);
    } catch (err: any) {
      console.log(chalk.red("✖"), "Error during login:", err.message);
      process.exit(1);
    }
  });
