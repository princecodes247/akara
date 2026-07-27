import { command, flag } from "commandstruct";
import open from "open";
import chalk from "chalk";

const generateDeviceCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const loginCmd = command("login")
  .describe("Login to Akara via browser")
  .flags({
    token: flag("Authentication token (bypasses browser login)").optionalParam("string"),
  })
  .action(async ({ flags }) => {
    if (flags.token) {
      console.log(chalk.green("✔"), "Successfully logged in with provided token.");
      return;
    }

    const deviceCode = generateDeviceCode();
    const loginUrl = `http://localhost:3000/auth/device?code=${deviceCode}`;

    console.log(`\nYour device authentication code is: ${chalk.bold.cyan(deviceCode)}\n`);
    console.log(`Opening browser to: ${loginUrl}`);
    console.log(`Waiting for authentication...`);

    try {
      await open(loginUrl);
    } catch (e) {
      console.log(chalk.yellow("Could not open browser automatically. Please open the URL manually."));
    }

    // Mock polling
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log(chalk.green("✔"), "Successfully logged in!");
  });
