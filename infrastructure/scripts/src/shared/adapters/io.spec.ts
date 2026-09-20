import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isInteractive } from "./io.ts";

const ORIGINAL_CI = process.env.CI;
const ORIGINAL_TTY = process.stdout.isTTY;

const setEnvironment = (isTTY: boolean, ci: boolean): void => {
    process.stdout.isTTY = isTTY;
    if (ci) process.env.CI = "1";
    else delete process.env.CI;
};

beforeEach(() => {
    delete process.env.CI;
    process.stdout.isTTY = false;
});

afterEach(() => {
    if (ORIGINAL_CI === undefined) delete process.env.CI;
    else process.env.CI = ORIGINAL_CI;

    process.stdout.isTTY = ORIGINAL_TTY;
});

describe("isInteractive", () => {
    it.each([
        [true, false, true],
        [false, false, false],
        [true, true, false],
        [false, true, false],
    ])("returns %j for TTY=%j and CI=%j", (isTTY, ci, expected) => {
        setEnvironment(isTTY, ci);

        expect(isInteractive()).toBe(expected);
    });
});
