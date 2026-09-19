import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { assertNotFlagLike, run } from "./exec.ts";

describe("run", () => {
    it("uses the executable selected by PATH so machine-specific installations work", () => {
        const bin = mkdtempSync(join(tmpdir(), "scripts-exec-"));

        try {
            symlinkSync(process.execPath, join(bin, "git"));
            vi.stubEnv("PATH", bin);

            expect(run("git", ["-e", "process.stdout.write('PATH git')"])).toBe("PATH git");
        }
        finally {
            vi.unstubAllEnvs();
            rmSync(bin, { recursive: true, force: true });
        }
    });
});

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
