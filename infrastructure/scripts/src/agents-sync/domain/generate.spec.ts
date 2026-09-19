import { describe, expect, it } from "vitest";
import {
    claudeDocPath,
    claudeSkillPath,
    isManagedTarget,
    renderGeneratedMarkdown,
    renderManifest,
    staleTargets,
} from "./generate.ts";

describe("Claude adapter paths", () => {
    it("places the root instruction adapter at the root", () => {
        expect(claudeDocPath("AGENTS.md")).toBe("CLAUDE.md");
    });

    it("places an instruction adapter beside its canonical AGENTS.md", () => {
        expect(claudeDocPath("packages/ui/AGENTS.md")).toBe("packages/ui/CLAUDE.md");
    });

    it("keeps a skill at the same depth so its relative links still resolve", () => {
        expect(claudeSkillPath(".agents/skills/house-docs/SKILL.md"))
            .toBe(".claude/skills/house-docs/SKILL.md");
    });
});

describe("renderGeneratedMarkdown", () => {
    it("puts the source warning ahead of an instruction document", () => {
        expect(renderGeneratedMarkdown("# Rules\n", "AGENTS.md"))
            .toBe("<!-- Generated from `AGENTS.md` by `pnpm agents:sync`. Edit the source, then rerun the command. -->\n\n# Rules\n");
    });

    it("keeps skill frontmatter first so Claude still discovers its metadata", () => {
        const source = "---\nname: demo\ndescription: Demo.\n---\n\n# Demo\n";
        const rendered = renderGeneratedMarkdown(source, ".agents/skills/demo/SKILL.md");

        expect(rendered).toMatch(/^---\nname: demo\ndescription: Demo\.\n---\n/);
        expect(rendered).toContain("Generated from `.agents/skills/demo/SKILL.md`");
    });
});

describe("renderManifest", () => {
    it("keeps the generated set explicit so stale adapters can be removed safely", () => {
        expect(renderManifest(["CLAUDE.md", ".claude/skills/demo/SKILL.md"]))
            .toBe("{\n  \"files\": [\n    \"CLAUDE.md\",\n    \".claude/skills/demo/SKILL.md\"\n  ]\n}\n");
    });
});

describe("staleTargets", () => {
    it("removes only previously recorded Claude adapters that no longer have a source", () => {
        expect(staleTargets(
            ["CLAUDE.md", "packages/old/CLAUDE.md", ".claude/skills/old/SKILL.md", ".claude/settings.json"],
            ["CLAUDE.md"],
        )).toEqual(["packages/old/CLAUDE.md", ".claude/skills/old/SKILL.md"]);
    });

    it("never treats native Claude configuration as generated output", () => {
        expect(isManagedTarget(".claude/settings.json")).toBe(false);
        expect(isManagedTarget(".claude/hooks/check-invariants.sh")).toBe(false);
    });

    it("rejects paths that could escape the generated directories", () => {
        expect(isManagedTarget("../CLAUDE.md")).toBe(false);
        expect(isManagedTarget(".claude/skills/../../settings.json")).toBe(false);
        expect(isManagedTarget("packages\\ui\\CLAUDE.md")).toBe(false);
    });
});
