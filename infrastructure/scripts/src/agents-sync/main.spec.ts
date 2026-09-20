import { beforeEach, describe, expect, it, vi } from "vitest";

const files = vi.hoisted(() => ({
    instructionFiles: vi.fn(), skillFiles: vi.fn(), readText: vi.fn(), readBytes: vi.fn(), modeOf: vi.fn(),
    matchesText: vi.fn(), matchesBytes: vi.fn(), readManifest: vi.fn(), writeText: vi.fn(), writeBytes: vi.fn(),
    removeFile: vi.fn(),
}));
const io = vi.hoisted(() => ({ out: { success: vi.fn() } }));
vi.mock("./adapters/files.ts", () => ({ ...files, MANIFEST_PATH: ".claude/generated.json" }));
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

beforeEach(() => {
    vi.clearAllMocks();
    files.instructionFiles.mockReturnValue(["AGENTS.md"]);
    files.skillFiles.mockReturnValue([".agents/skills/demo/SKILL.md", ".agents/skills/demo/reference.md"]);
    files.readText.mockImplementation((path: string) => path === "AGENTS.md" ? "rules" : "---\nname: demo\n---\nskill");
    files.readBytes.mockReturnValue(Buffer.from([1, 2]));
    files.modeOf.mockReturnValue(0o644);
    files.readManifest.mockReturnValue([]);
    files.matchesText.mockReturnValue(true);
    files.matchesBytes.mockReturnValue(true);
});

describe("agents-sync main", () => {
    it("writes text, frontmatter skills, binary skills, stale removal and the manifest", () => {
        main({ flags: new Set(), positionals: [] });

        expect(files.writeText).toHaveBeenCalledWith("CLAUDE.md", expect.stringContaining("Generated from"), 0o644);
        expect(files.writeText).toHaveBeenCalledWith(".claude/skills/demo/SKILL.md", expect.stringContaining("Generated from"), 0o644);
        expect(files.writeBytes).toHaveBeenCalledWith(".claude/skills/demo/reference.md", Buffer.from([1, 2]), 0o644);
        expect(files.writeText).toHaveBeenCalledWith(".claude/generated.json", expect.any(String));
        expect(io.out.success).toHaveBeenCalledWith(expect.stringContaining("Wrote 3 Claude adapters"));
    });

    it("reports a clean check without writing", () => {
        files.readManifest.mockReturnValue(["CLAUDE.md", ".claude/skills/demo/SKILL.md", ".claude/skills/demo/reference.md"]);

        main({ flags: new Set(["check"]), positionals: [] });

        expect(io.out.success).toHaveBeenCalledWith("3 Claude adapters are up to date.");
        expect(files.writeText).not.toHaveBeenCalled();
    });

    it("reports changed and stale generated outputs during check", () => {
        files.readManifest.mockReturnValue(["CLAUDE.md", "old/CLAUDE.md"]);
        files.matchesText.mockReturnValue(false);

        expect(() => main({ flags: new Set(["check"]), positionals: [] })).toThrow(
            /Claude adapters are out of date: CLAUDE\.md, \.claude\/skills\/demo\/SKILL\.md, \.claude\/generated\.json, old\/CLAUDE\.md/,
        );
    });
});
