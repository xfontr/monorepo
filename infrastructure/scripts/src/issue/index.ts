#!/usr/bin/env node
import { log } from "@clack/prompts";
import process from "node:process";
import { add } from "./add.ts";
import { pick } from "./pick.ts";

const COMMANDS = {
    add,
    pick,
};

const command = process.argv[2];

if (!Object.hasOwn(COMMANDS, command ?? "")) {
    log.error(`Usage: node src/issue/index.ts <${Object.keys(COMMANDS).join("|")}>`);
    process.exit(1);
}

await COMMANDS[command as keyof typeof COMMANDS]();
