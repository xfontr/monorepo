import { describe, expect, it } from "vitest";
import type { Capability, Doc } from "./capabilities.ts";
import { render } from "./render.ts";

const command = (invocation: string, source: string, token: string): Capability => ({
    kind: "command",
    invocation,
    source,
    token,
});

describe("render", () => {
    // A hand-kept list is what let real capabilities stay undocumented for years — an empty
    // section would look like the same kind of silent gap instead of "there are none".
    it("omits a section entirely when it has no capabilities, rather than an empty table", () => {
        const markdown = render([command("pnpm docs:map", "package.json", "docs:map")], []);

        expect(markdown).toContain("## ⌨️ Commands");
        expect(markdown).not.toContain("## 🪝 Git hooks");
        expect(markdown).not.toContain("## ⚙️ Workflows");
        expect(markdown).not.toContain("## 🛠 Agent skills");
    });

    // The `—` is the one signal this file exists to produce — a row that silently linked to
    // nothing, or fell back to some other text, would hide the exact gap it's meant to surface.
    it("marks an undocumented capability with a dash instead of leaving the cell blank", () => {
        const markdown = render([command("pnpm release", "package.json", "release")], []);

        expect(markdown).toContain("| `pnpm release` | [`package.json`](../package.json) | — |");
    });

    it("links a documented capability to the doc that explains it, not just names it", () => {
        const capability = command("pnpm docs:map", "package.json", "docs:map");
        const docs: Doc[] = [{ path: "README.md", text: "| `pnpm docs:map` | Render the map |" }];

        const markdown = render([capability], docs);

        expect(markdown).toContain("| `pnpm docs:map` | [`package.json`](../package.json) | [`README.md`](../README.md) |");
    });

    // Sections are ordered by SECTIONS, not by input order — a reader always finds commands
    // before hooks before workflows before skills, regardless of how the capabilities were found.
    it("keeps sections in a fixed order regardless of the order capabilities were passed in", () => {
        const capabilities: Capability[] = [
            { kind: "skill", invocation: "/new-package", source: ".claude/skills/new-package/SKILL.md", token: "new-package" },
            command("pnpm lint", "package.json", "lint"),
        ];

        const markdown = render(capabilities, []);

        expect(markdown.indexOf("## ⌨️ Commands")).toBeLessThan(markdown.indexOf("## 🛠 Agent skills"));
    });
});
