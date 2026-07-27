import { arg, command, flag } from "commandstruct";

export const rollbackCmd = command("rollback")
  .describe("Rollback a channel to a previous release")
  .args({
    channel: arg(),
  })
  .flags({
    to: flag("Release to rollback to").requiredParam("string"),
  })
  .action(({ args, flags }) => {
    console.log(`Rolling back channel ${args.channel}${flags.to ? ` to release ${flags.to}` : ''}...`);
    console.log(`Done`);
  });
