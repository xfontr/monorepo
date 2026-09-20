import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ resolve: vi.fn(), inherit: vi.fn(), repoRoot: vi.fn(() => "/repo") }));
vi.mock("node:module", () => ({ createRequire: () => ({ resolve: state.resolve }) }));
vi.mock("../../shared/adapters/exec.ts", () => ({ inherit: state.inherit }));
vi.mock("../../shared/adapters/git.ts", () => ({ repoRoot: state.repoRoot }));

import { dev, ensureInstalled } from "./pnpm.ts";

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("ensureInstalled", () => {
    it("does not install when the clack dependency resolves", () => {
        state.resolve.mockReturnValue("/repo/node_modules/@clack/prompts");

        expect(ensureInstalled()).toBe(true);
        expect(state.inherit).not.toHaveBeenCalled();
    });

    it("installs into the repository when the dependency is missing and returns its status", () => {
        state.resolve.mockImplementation(() => {
            throw new Error("missing");
        });
        state.inherit.mockReturnValueOnce(0).mockReturnValueOnce(1);

        expect(ensureInstalled()).toBe(true);
        expect(ensureInstalled()).toBe(false);
        expect(state.inherit).toHaveBeenNthCalledWith(1, "pnpm", ["-C", "/repo", "install"]);
    });
});

describe("dev", () => {
    it("starts the selected project through pnpm and returns its status", () => {
        state.inherit.mockReturnValue(7);

        expect(dev("@monorepo/demo")).toBe(7);
        expect(state.inherit).toHaveBeenCalledWith("pnpm", ["--filter", "@monorepo/demo", "run", "dev"]);
    });
});
