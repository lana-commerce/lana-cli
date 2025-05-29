#!/usr/bin/env -S deno run -A

import { Command } from "@cliffy/command";
import { addSubCommands } from "./generated/_subcommands.ts";
import { setColorEnabled } from "@std/fmt/colors";
import { version } from "./lib/version.ts";

if (Deno.build.os === "windows") {
  // force colors to be disabled on windows
  setColorEnabled(false);
}

interface FirstArgSubCommand {
  name: string;
  command: Command;
}

interface SubCommand {
  name: string;
  description: string;
}

const subCommands: SubCommand[] = [
  { name: "update", description: "Update the Lana Commerce CLI tool to latest version." },
  { name: "login", description: "Login to Lana API. Shortcut for `config login`. (interactive)" },
  { name: "config", description: "Configure Lana Commerce CLI tool." },
];
addSubCommands(subCommands);

async function tryLoadSubCommand(firstArg: string): Promise<FirstArgSubCommand | undefined> {
  let result: FirstArgSubCommand | undefined;

  try {
    const cmd = (await import(`./commands/${firstArg}.ts`))?.default;
    if (cmd instanceof Command) {
      result = { name: firstArg, command: cmd };
    }
  } catch {
    // console.error(err);
  }
  if (result) return result;
  try {
    const cmd = (await import(`./generated/${firstArg}.ts`))?.default;
    if (cmd instanceof Command) {
      result = { name: firstArg, command: cmd };
    }
  } catch {
    // console.error(err);
  }
  return result;
}

function getFirstArgumentCommand(args: string[]): Promise<FirstArgSubCommand | undefined> {
  const firstArg = args.length > 0 ? args[0] : undefined;
  if (firstArg && !firstArg.startsWith("-")) {
    return tryLoadSubCommand(firstArg);
  }
  return Promise.resolve(undefined);
}

const fac = await getFirstArgumentCommand(Deno.args);

const mainCommand = new Command()
  .name("lana")
  .version(version)
  .description("Manage Lana Commerce API resources.")
  .action(() => {
    mainCommand.showHelp();
  });

for (const sc of subCommands) {
  if (fac && fac.name === sc.name) {
    // async imported command
    mainCommand.command(sc.name, fac.command);
  } else {
    // placeholder
    mainCommand.command(sc.name, sc.description);
  }
}

await mainCommand.parse();
