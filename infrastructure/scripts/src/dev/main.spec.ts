import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prompts = vi.hoisted(() => ({ autocomplete: vi.fn() }));
const nx = vi.hoisted(() => ({ projectsWithDev: vi.fn() }));
const pnpm = vi.hoisted(() => ({ dev: vi.fn() }));
const io = vi.hoisted(() => ({
    isInteractive: vi.fn(),
    out: {
        begin: vi.fn(), end: vi.fn(), warn: vi.fn(),
        spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() })),
    },
}));
const promptAdapter = vi.hoisted(() => ({ orExit: vi.fn((value: unknown) => value) }));

vi.mock("@clack/prompts", () => prompts);
vi.mock("./adapters/nx.ts", () => nx);
vi.mock("./adapters/pnpm.ts", () => pnpm);
vi.mock("../shared/adapters/io.ts", () => io);
vi.mock("../shared/adapters/prompts.ts", () => promptAdapter);

import { main } from "./main.ts";

const originalExitCode = process.exitCode;

beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    nx.projectsWithDev.mockReturnValue([]);
    io.isInteractive.mockReturnValue(false);
});

afterEach(() => {
    process.exitCode = originalExitCode;
});

describe("dev main", () => {
    it("fails clearly when no project declares a dev target", async () => {
        await expect(main({ flags: new Set(), positionals: [] })).rejects.toThrow(
            "Nothing in this workspace declares a `dev` script.",
        );
    });

    it("runs a named project and forwards a nonzero child status", async () => {
        nx.projectsWithDev.mockReturnValue([{ root: "apps", name: "@monorepo/demo" }]);
        pnpm.dev.mockReturnValue(4);

        await main({ flags: new Set(), positionals: ["demo"] });

        expect(pnpm.dev).toHaveBeenCalledWith("@monorepo/demo");
        expect(process.exitCode).toBe(4);
    });

    it("warns for an unknown name and asks interactively", async () => {
        nx.projectsWithDev.mockReturnValue([{ root: "apps", name: "@monorepo/demo" }]);
        io.isInteractive.mockReturnValue(true);
        prompts.autocomplete.mockResolvedValue({ root: "apps", name: "@monorepo/demo", label: "Demo" });

        await main({ flags: new Set(), positionals: ["missing"] });

        expect(io.out.warn).toHaveBeenCalledWith("No project here is called \"missing\" — search below.");
        expect(prompts.autocomplete).toHaveBeenCalledWith(expect.objectContaining({ initialUserInput: "missing", maxItems: 12 }));
        expect(pnpm.dev).toHaveBeenCalledWith("@monorepo/demo");
    });

    it("rejects an unnamed non-interactive invocation with usable names", async () => {
        nx.projectsWithDev.mockReturnValue([{ root: "apps", name: "@monorepo/demo" }]);

        await expect(main({ flags: new Set(), positionals: [] })).rejects.toThrow(
            "No terminal to pick with — name a project: pnpm dev <demo>",
        );
    });

    it("treats a null child status as Ctrl+C without setting an exit code", async () => {
        nx.projectsWithDev.mockReturnValue([{ root: "apps", name: "@monorepo/demo" }]);
        pnpm.dev.mockReturnValue(null);

        await main({ flags: new Set(), positionals: ["demo"] });

        expect(process.exitCode).toBeUndefined();
    });
});
