import type { PlaywrightTestConfig } from "@playwright/test";

export interface PlaywrightOptions {
    port: number
    /** Starts the built app; it reads `PORT` and gets `env` on top of the runner's own. */
    command: string
    env?: Record<string, string>
    widths?: number[]
}

/**
 * Chromium at each width, specs in `e2e/`, and screenshot baselines that only CI writes.
 * Returns a plain object, so the runner's own copy of `@playwright/test` is the only one loaded.
 */
export function createConfig({ port, command, env = {}, widths = [390, 768, 1280] }: PlaywrightOptions): PlaywrightTestConfig {
    const baseURL = `http://localhost:${port}`;

    return {
        testDir: "e2e",
        outputDir: ".playwright",
        // No `{platform}`: baselines are only ever written inside CI's pinned Playwright image
        snapshotPathTemplate: "{testDir}/__screenshots__/{testFileName}/{projectName}/{arg}{ext}",
        ignoreSnapshots: !process.env.CI,
        forbidOnly: !!process.env.CI,
        reporter: "list",
        use: { baseURL },
        projects: widths.map((width) => ({
            name: `${width}px`,
            use: { browserName: "chromium", viewport: { width, height: 900 } },
        })),
        webServer: {
            command,
            url: baseURL,
            env: { PORT: String(port), ...env },
            reuseExistingServer: false,
        },
    };
}
