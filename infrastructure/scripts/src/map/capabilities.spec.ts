import { describe, expect, it } from "vitest";
import type { Capability, Doc } from "./capabilities.ts";
import { documentedBy, mentions, projectCommands, rootCommands, skills } from "./capabilities.ts";

const command = (invocation: string, source: string, token: string): Capability => ({
    kind: "command",
    invocation,
    source,
    token,
});

describe("mentions", () => {
    // `pnpm release` is deliberately undocumented (releases run from the Release workflow), so a
    // doc that only covers `release:dry` must not make its row look answered.
    it("does not let a longer script name satisfy the shorter one it starts with", () => {
        expect(mentions("Locally: `pnpm release:dry`", "release")).toBe(false);
        expect(mentions("| `pnpm test:coverage` |", "test")).toBe(false);
    });

    it("matches a token the skills table has prefixed with its project scope", () => {
        expect(mentions("| `content:new-vendor` | Adding a CMS vendor |", "new-vendor")).toBe(true);
    });

    it("treats a token as found when it stands alone", () => {
        expect(mentions("The `pre-push` hook runs lint", "pre-push")).toBe(true);
    });
});

describe("rootCommands", () => {
    it("keeps every root script, since the root is the repo's whole command surface", () => {
        expect(rootCommands(["lint", "graph"])).toEqual([
            command("pnpm lint", "package.json", "lint"),
            command("pnpm graph", "package.json", "graph"),
        ]);
    });
});

describe("projectCommands", () => {
    // Eight projects times five standard targets would bury the handful of commands that are
    // actually specific to one project.
    it("drops the targets every project declares, leaving only what is specific to one", () => {
        const rows = projectCommands(
            [{ root: "packages/ui", name: "@monorepo/ui", scripts: ["lint", "test", "storybook"] }],
            [],
        );

        expect(rows).toEqual([
            command("pnpm exec nx storybook @monorepo/ui", "packages/ui/package.json", "storybook"),
        ]);
    });

    it("drops a script the root already exposes, so one capability never gets two invocations", () => {
        const rows = projectCommands(
            [{ root: "infrastructure/scripts", name: "@monorepo/scripts", scripts: ["issue:add"] }],
            ["issue:add"],
        );

        expect(rows).toEqual([]);
    });
});

describe("skills", () => {
    it("addresses a project skill by scope, the only thing telling two new-vendor skills apart", () => {
        const rows = skills([
            { source: "packages/content/.claude/skills/new-vendor/SKILL.md", name: "new-vendor", scope: "content" },
            { source: "packages/i18n/.claude/skills/new-vendor/SKILL.md", name: "new-vendor", scope: "i18n" },
        ]);

        expect(rows.map((row) => row.invocation)).toEqual(["/content:new-vendor", "/i18n:new-vendor"]);
    });
});

describe("documentedBy", () => {
    it("reports nothing rather than a near miss when no doc names the capability", () => {
        const docs: Doc[] = [{ path: "README.md", text: "nothing relevant" }];

        expect(documentedBy(command("pnpm docs:map", "package.json", "docs:map"), docs)).toBeUndefined();
    });

    it("never lets a skill cite its own SKILL.md, which would answer every row trivially", () => {
        const own = ".claude/skills/house-docs/SKILL.md";
        const docs: Doc[] = [
            { path: own, text: "name: house-docs" },
            { path: "CLAUDE.md", text: "| `house-docs` | Writing markdown |" },
        ];

        expect(documentedBy(skills([{ source: own, name: "house-docs" }])[0], docs)).toBe("CLAUDE.md");
    });

    // Nearness alone made every skill cite a sibling skill: two shared path segments under
    // `.claude/skills/` outranked the root CLAUDE.md table that actually indexes them.
    it("prefers the table that indexes a skill over a sibling skill that merely mentions it", () => {
        const docs: Doc[] = [
            { path: ".claude/skills/doc-drift-check/SKILL.md", text: "follow the house-docs skill" },
            { path: "CLAUDE.md", text: "| `house-docs` | Writing markdown |" },
        ];
        const capability = skills([{ source: ".claude/skills/house-docs/SKILL.md", name: "house-docs" }])[0];

        expect(documentedBy(capability, docs)).toBe("CLAUDE.md");
    });

    it("points a project's command at the README beside it, not at the root one", () => {
        const docs: Doc[] = [
            { path: "README.md", text: "`pnpm storybook` somewhere in here" },
            { path: "packages/ui/README.md", text: "| `pnpm storybook` | Storybook on port 6006 |" },
        ];
        const capability = command("pnpm exec nx storybook @monorepo/ui", "packages/ui/package.json", "storybook");

        expect(documentedBy(capability, docs)).toBe("packages/ui/README.md");
    });

    it("sends a reader to a README rather than the agent-facing file that also names it", () => {
        const docs: Doc[] = [
            { path: "CLAUDE.md", text: "the `pre-push` gate" },
            { path: "README.md", text: "The `pre-push` hook runs lint, test and typecheck" },
        ];

        expect(documentedBy(command("git push", ".husky/pre-push", "pre-push"), docs)).toBe("README.md");
    });
});
