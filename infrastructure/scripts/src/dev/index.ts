#!/usr/bin/env node
import process from "node:process";
import { ensureInstalled } from "./adapters/pnpm.ts";

/**
 * The one entry point that isn't the five-line copy every other script has, because it's the one a
 * fresh clone runs before anything is installed. A static `import` of `../shared/cli.ts` reaches
 * `@clack/prompts` through `io.ts`, so on that clone the process would die with
 * ERR_MODULE_NOT_FOUND before it could explain itself — which is the exact first-run experience
 * this script exists to fix. Install first, then import the rest.
 */
if (ensureInstalled()) {
    const { run } = await import("../shared/cli.ts");
    const { main } = await import("./main.ts");

    await run(main);
}
else {
    process.exitCode = 1;
}
