#!/usr/bin/env -S deno run -A

import { Command } from "@cliffy/command";
import { addSubCommands } from "./generated/_subcommands.ts";

interface FirstArgSubCommand {
  name: string;
  command: Command;
}

interface SubCommand {
  name: string;
  description: string;
}

const subCommands: SubCommand[] = [
  { name: "login", description: "Login to Lana API. Shortcut for `config login`. (interactive)" },
  { name: "config", description: "Configure Lana Commerce CLI tool." },
];
addSubCommands(subCommands);

async function tryLoadSubCommand(path: string, firstArg: string): Promise<FirstArgSubCommand | undefined> {
  try {
    const cmd = (await import(path))?.default;
    if (cmd instanceof Command) {
      return { name: firstArg, command: cmd };
    }
  } catch {
    return undefined;
  }
}

async function getFirstArgumentCommand(args: string[]): Promise<FirstArgSubCommand | undefined> {
  const firstArg = args.length > 0 ? args[0] : undefined;
  if (firstArg && !firstArg.startsWith("-")) {
    return (
      await tryLoadSubCommand(`./commands/${firstArg}.ts`, firstArg) ||
      await tryLoadSubCommand(`./generated/${firstArg}.ts`, firstArg)
    );
  }
  return undefined;
}

const fac = await getFirstArgumentCommand(Deno.args);

const mainCommand = new Command()
  .name("lana")
  .version("0.1")
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
