import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PlaywrightTestConfig } from "@playwright/test";
import { SERVER_CONSOLE_ENV } from "./server.ts";

export interface PlaywrightOptions {
    port: number;
    /** Starts the built app; it reads `PORT` and gets `env` on top of the runner's own. */
    command: string;
    env?: Record<string, string>;
    widths?: number[];
}

/** Chromium at each width, with specs in `e2e/`, failing the run on anything the server logs. */
export const createConfig = ({
    port,
    command,
    env = {},
    widths = [390, 768, 1280],
}: PlaywrightOptions): PlaywrightTestConfig => {
    const baseURL = `http://localhost:${port}`;
    // Outside `outputDir`, which Playwright empties after the server may already have written
    const serverConsole = join(process.cwd(), "node_modules/.cache/e2e/server-console.log");

    return {
        testDir: "e2e",
        outputDir: ".playwright",
        forbidOnly: !!process.env.CI,
        reporter: "list",
        globalTeardown: fileURLToPath(new URL("./teardown.ts", import.meta.url)),
        use: { baseURL },
        projects: widths.map((width) => ({
            name: `${width}px`,
            use: { browserName: "chromium", viewport: { width, height: 900 } },
        })),
        webServer: {
            command,
            url: baseURL,
            env: { PORT: String(port), [SERVER_CONSOLE_ENV]: serverConsole, ...env },
            reuseExistingServer: false,
        },
    };
};
