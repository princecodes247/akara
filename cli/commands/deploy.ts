import { arg, command } from "commandstruct";

export const deployCmd = command("deploy")
  .describe("Deploy to a channel")
  .args({
    channel: arg(),
  })
  .action(({ args }) => {
    console.log(`Deploying to ${args.channel}...`);
    console.log(`Done`);
  });
