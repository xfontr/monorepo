import { beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({ writeFileSync: vi.fn() }));
const files = vi.hoisted(() => ({
    rootScripts: vi.fn(), projectScripts: vi.fn(), hookNames: vi.fn(), workflowFiles: vi.fn(), skillFiles: vi.fn(), docs: vi.fn(), readMap: vi.fn(),
}));
const domain = vi.hoisted(() => ({ rootCommands: vi.fn(), projectCommands: vi.fn(), hooks: vi.fn(), workflows: vi.fn(), skills: vi.fn(), render: vi.fn() }));
const git = vi.hoisted(() => ({ at: vi.fn((path: string) => `/repo/${path}`) }));
const io = vi.hoisted(() => ({ out: { success: vi.fn() } }));
vi.mock("node:fs", () => fs);
vi.mock("./adapters/files.ts", () => ({ ...files, MAP_PATH: "docs/FEATURES.md" }));
vi.mock("./domain/capabilities.ts", () => domain);
vi.mock("./domain/render.ts", () => domain);
vi.mock("../shared/adapters/git.ts", () => git);
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

beforeEach(() => {
    vi.clearAllMocks();
    files.rootScripts.mockReturnValue(["lint"]);
    files.projectScripts.mockReturnValue([]);
    files.hookNames.mockReturnValue([]);
    files.workflowFiles.mockReturnValue([]);
    files.skillFiles.mockReturnValue([]);
    files.docs.mockReturnValue([]);
    domain.rootCommands.mockReturnValue([]);
    domain.projectCommands.mockReturnValue([]);
    domain.hooks.mockReturnValue([]);
    domain.workflows.mockReturnValue([]);
    domain.skills.mockReturnValue([]);
    domain.render.mockReturnValue("rendered");
    files.readMap.mockReturnValue("rendered");
});

describe("map main", () => {
    it("renders and writes the generated feature map", () => {
        main({ flags: new Set(), positionals: [] });

        expect(fs.writeFileSync).toHaveBeenCalledWith("/repo/docs/FEATURES.md", "rendered");
        expect(io.out.success).toHaveBeenCalledWith("Wrote docs/FEATURES.md.");
    });

    it("accepts a current generated map under check", () => {
        main({ flags: new Set(["check"]), positionals: [] });

        expect(io.out.success).toHaveBeenCalledWith("docs/FEATURES.md is up to date.");
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("rejects stale generated output under check", () => {
        files.readMap.mockReturnValue("stale");

        expect(() => main({ flags: new Set(["check"]), positionals: [] })).toThrow("docs/FEATURES.md is out of date");
    });

    it("does not hide a filesystem failure while writing the generated map", () => {
        fs.writeFileSync.mockImplementation(() => {
            throw new Error("read-only");
        });

        expect(() => main({ flags: new Set(), positionals: [] })).toThrow("read-only");
    });
});
