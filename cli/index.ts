#!/usr/bin/env bun
import { program } from "commandstruct";
import { loginCmd } from "./commands/login";
import { initCmd } from "./commands/init";
import { buildCmd } from "./commands/build";
import { releaseCmd } from "./commands/release";
import { deployCmd } from "./commands/deploy";
import { promoteCmd } from "./commands/promote";
import { rollbackCmd } from "./commands/rollback";
import { statusCmd } from "./commands/status";

const prog = program("akara")
  .describe("The Akara CLI")
  .version("1.0.0")
  .commands(
    loginCmd,
    initCmd,
    buildCmd,
    releaseCmd,
    deployCmd,
    promoteCmd,
    rollbackCmd,
    statusCmd
  )
  .build();

prog.run();