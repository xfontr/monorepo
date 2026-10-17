import { format } from "node:util";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

const METHODS = ["log", "info", "warn", "error", "debug"] as const;

interface ConsoleCall {
    method: (typeof METHODS)[number];
    message: string;
    stack: string;
}

// Vue logs this the first time any <Suspense> mounts, and every Nuxt app renders inside one
// src: https://github.com/nuxt/nuxt/discussions/25973#discussioncomment-12203169
const UPSTREAM = [/^<Suspense> is an experimental feature/];

const calls: ConsoleCall[] = [];

// Installed once: in the `nuxt` project the app boots after this file, and its plugins may wrap these
for (const method of METHODS) {
    // eslint-disable-next-line no-console -- the guard replaces each method with its recorder
    console[method] = (...args: unknown[]) => {
        const message = format(...args);
        if (UPSTREAM.some((pattern) => pattern.test(message))) return;

        const stack = (new Error().stack ?? "").split("\n").slice(2, 6).join("\n");
        calls.push({ method, message, stack });
    };
}

const failOnOutput = () => {
    if (!calls.length) return;

    const report = calls
        .map(({ method, message, stack }) => `console.${method}: ${message}\n${stack}`)
        .join("\n\n");
    calls.length = 0;

    throw new Error(
        `Console output fails the test. If it's expected, stub it with \`vi.spyOn(console, "<method>").mockImplementation(() => {})\` and assert on the spy.\n\n${report}`,
    );
};

beforeAll(failOnOutput);

afterEach(() => {
    vi.restoreAllMocks();
    failOnOutput();
});

afterAll(failOnOutput);
