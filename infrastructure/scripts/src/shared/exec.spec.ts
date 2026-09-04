import { describe, expect, it } from "vitest";
import { assertNotFlagLike } from "./exec.ts";

describe("assertNotFlagLike", () => {
    it("returns the value unchanged when it doesn't start with a dash", () => {
        expect(assertNotFlagLike("Fix the login bug", "title")).toBe("Fix the login bug");
    });

    // A value gh would read as its own flag rather than the one before it is exactly the
    // argument-injection shape this guards against.
    it("throws when the value starts with a dash", () => {
        expect(() => assertNotFlagLike("--body-file=/etc/passwd", "title")).toThrow(/title/);
    });
});
