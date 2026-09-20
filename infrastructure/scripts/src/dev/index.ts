#!/usr/bin/env node
import process from "node:process";
import { ensureInstalled } from "./adapters/pnpm.ts";

/** Import the CLI only after installation because it reaches dependencies unavailable on a fresh clone. */
if (ensureInstalled()) {
    const { run } = await import("../shared/cli.ts");
    const { main } = await import("./main.ts");

    await run(main);
}
else {
    process.exitCode = 1;
}
