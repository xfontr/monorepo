import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { format } from "node:util";

/** Names the file the server's console is recorded to; `createConfig` sets it per app. */
export const SERVER_CONSOLE_ENV = "E2E_SERVER_CONSOLE";

const STARTUP = /^Listening on /;

/** Replaces the server's console with a recorder that `teardown.ts` fails the run on. */
export const recordServerConsole = (): void => {
    const path = process.env[SERVER_CONSOLE_ENV];
    if (!path) {
        throw new Error(`${SERVER_CONSOLE_ENV} is unset; start the server from createConfig`);
    }

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "");

    // Printed only until the server listens, so a boot crash still reaches Playwright's output
    // while a request's log is reported once, by the teardown
    let listening = false;

    for (const method of ["log", "info", "warn", "error", "debug"] as const) {
        // eslint-disable-next-line no-console -- kept to print boot output
        const original = console[method].bind(console);

        // eslint-disable-next-line no-console -- the preload records the server console by replacing it
        console[method] = (...args: unknown[]) => {
            const message = format(...args);

            if (STARTUP.test(message)) {
                listening = true;
                return;
            }

            appendFileSync(path, `console.${method}: ${message}\n`);
            if (!listening) original(...args);
        };
    }
};
