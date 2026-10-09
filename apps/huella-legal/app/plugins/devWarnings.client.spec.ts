import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import plugin from "./devWarnings.client";

const SUSPENSE_WARNING = "<Suspense> is an experimental feature and its API will likely change.";

const originalInfo = console.info;
const info = vi.fn();

const run = () => {
    (plugin as unknown as () => void)();
};

beforeEach(() => {
    info.mockClear();
    console.info = info;
});

afterEach(() => {
    console.info = originalInfo;
    vi.unstubAllEnvs();
});

describe("the dev warnings plugin", () => {
    it("drops Vue's Suspense notice", () => {
        run();

        console.info(SUSPENSE_WARNING);

        expect(info).not.toHaveBeenCalled();
    });

    it("passes every other message through with all its arguments", () => {
        run();

        console.info("hydrated", { ms: 12 });
        console.info({ event: SUSPENSE_WARNING });

        expect(info).toHaveBeenNthCalledWith(1, "hydrated", { ms: 12 });
        expect(info).toHaveBeenNthCalledWith(2, { event: SUSPENSE_WARNING });
    });

    it("leaves the console untouched outside dev", () => {
        vi.stubEnv("DEV", false);

        run();

        expect(console.info).toBe(info);
    });
});
