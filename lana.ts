#!/usr/bin/env -S deno run -A

import { Command } from "@cliffy/command";

interface FirstArgSubCommand {
  name: string;
  command: Command;
}

interface SubCommand {
  name: string;
  description: string;
}

const subCommands: SubCommand[] = [
  { name: "config", description: "Configure Lana CLI tool." },
  { name: "files", description: "Manage files." },
  { name: "customers", description: "Manage customers." },
  { name: "products", description: "Manage products." },
  { name: "orders", description: "Manage orders." },
];

async function getFirstArgumentCommand(args: string[]): Promise<FirstArgSubCommand | undefined> {
  const firstArg = args.length > 0 ? args[0] : undefined;
  if (firstArg && !firstArg.startsWith("-")) {
    const cmd = (await import(`./commands/${firstArg}.ts`))?.default;
    if (cmd instanceof Command) {
      const sc = subCommands.find((sc) => sc.name === firstArg);
      if (sc) cmd.description(sc.description);
      return { name: firstArg, command: cmd };
    }
  }
  return undefined;
}

const fac = await getFirstArgumentCommand(Deno.args);

const mainCommand = new Command()
  .name("lana")
  .version("0.1")
  .description("Manage Lana API resources.");

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
