import { describe, expect, it } from "vitest";
import { isMissingChecksError } from "./checks.ts";

describe("isMissingChecksError", () => {
    it("matches gh's message for a PR with no check runs attached yet", () => {
        expect(isMissingChecksError("no checks reported on the 'feature/1-x' branch")).toBe(true);
    });

    it("doesn't match a genuine failing check's output", () => {
        expect(isMissingChecksError("X  build  1s  https://github.com/…")).toBe(false);
    });
});
