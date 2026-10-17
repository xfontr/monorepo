import { existsSync, readFileSync, rmSync } from "node:fs";
import type { FullConfig } from "@playwright/test";
import { SERVER_CONSOLE_ENV } from "./server.ts";

/** Fails the run on anything the built server logged, which no browser fixture can see. */
export default (config: FullConfig) => {
    const path = config.webServer?.env?.[SERVER_CONSOLE_ENV];
    if (!path) return;
    if (!existsSync(path)) {
        throw new Error(
            "The server never recorded its console: call recordServerConsole() in its preload",
        );
    }

    const output = readFileSync(path, "utf8").trim();
    // Removed every run, so a later preload that drops the recorder can't pass on a stale file
    rmSync(path);

    if (output) throw new Error(`The server logged during the e2e run:\n\n${output}`);
};
