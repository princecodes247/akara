import { arg, command } from "commandstruct";

export const promoteCmd = command("promote")
  .describe("Promote a release to a channel")
  .args({
    release: arg(),
    channel: arg(),
  })
  .action(({ args }) => {
    console.log(`Promoting release ${args.release} to ${args.channel}...`);
    console.log(`Done`);
  });
