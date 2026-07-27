import { command, flag } from "commandstruct";

export const releaseCmd = command("release")
  .describe("Create a new release")
  .flags({
    name: flag("Release Name").requiredParam("string"),
    channel: flag("Release Channel").requiredParam("string"),
    notes: flag("Release Notes").optionalParam("string"),
  })
  .action(({ flags }) => {
    console.log(`Uploading artifacts...`);
    console.log(`Creating release ${flags.name} on channel ${flags.channel}...`);
    console.log(`Done`);
  });
