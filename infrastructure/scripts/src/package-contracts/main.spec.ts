import { beforeEach, describe, expect, it, vi } from "vitest";

const files = vi.hoisted(() => ({ readPackages: vi.fn() }));
const validator = vi.hoisted(() => ({ validatePackage: vi.fn() }));
const io = vi.hoisted(() => ({
    out: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("./adapters/files.ts", () => files);
vi.mock("./domain/validate.ts", () => validator);
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

const source = (directory: string) => ({ directory, files: [], manifest: {} });

beforeEach(() => {
    vi.clearAllMocks();
    files.readPackages.mockReturnValue([source("demo"), source("other")]);
});

describe("package-contracts main", () => {
    it("reports every valid package and explicit peer metadata skips", () => {
        validator.validatePackage
            .mockReturnValueOnce({ packageName: "@monorepo/demo", errors: [], skipped: ["peer metadata (not present)"] })
            .mockReturnValueOnce({ packageName: "@monorepo/other", errors: [], skipped: [] });

        expect(() => main()).not.toThrow();
        expect(io.out.success).toHaveBeenCalledTimes(2);
        expect(io.out.info).toHaveBeenCalledWith("⏭ Skipped @monorepo/demo: peer metadata (not present).");
        expect(validator.validatePackage).toHaveBeenCalledTimes(2);
    });

    it("reports all package errors before failing the command", () => {
        validator.validatePackage
            .mockReturnValueOnce({
                packageName: "@monorepo/demo",
                errors: ["@monorepo/demo: name received wrong"],
                skipped: [],
            })
            .mockReturnValueOnce({
                packageName: "@monorepo/other",
                errors: ["@monorepo/other: exports target file is missing: ./missing.ts"],
                skipped: ["peer metadata (not present)"],
            });

        expect(() => main()).toThrow("package:check found 2 contract error(s).");
        expect(io.out.error).toHaveBeenCalledWith("  @monorepo/demo: name received wrong");
        expect(io.out.error).toHaveBeenCalledWith("  @monorepo/other: exports target file is missing: ./missing.ts");
        expect(io.out.info).toHaveBeenCalledWith("⏭ Skipped @monorepo/other: peer metadata (not present).");
        expect(validator.validatePackage).toHaveBeenCalledTimes(2);
    });
});
