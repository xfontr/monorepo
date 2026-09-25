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

    it("does not let a longer name satisfy the shorter one it ends with", () => {
        expect(mentions("| `pnpm test:coverage` |", "coverage")).toBe(false);
        expect(mentions("the latest release", "test")).toBe(false);
    });

    it("matches a namespaced skill token when it stands alone", () => {
        expect(mentions("| `content-new-vendor` | Adding a CMS vendor |", "content-new-vendor")).toBe(true);
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
    it("uses the unique canonical name Codex invokes from the root", () => {
        const rows = skills([
            { source: ".agents/skills/content-new-vendor/SKILL.md", name: "content-new-vendor" },
            { source: ".agents/skills/i18n-new-vendor/SKILL.md", name: "i18n-new-vendor" },
        ]);

        expect(rows.map((row) => row.invocation)).toEqual(["$content-new-vendor", "$i18n-new-vendor"]);
    });
});

describe("documentedBy", () => {
    it("reports nothing rather than a near miss when no doc names the capability", () => {
        const docs: Doc[] = [{ path: "README.md", text: "nothing relevant" }];

        expect(documentedBy(command("pnpm docs:map", "package.json", "docs:map"), docs)).toBeUndefined();
    });

    it("never lets a skill cite its own SKILL.md, which would answer every row trivially", () => {
        const own = ".agents/skills/house-docs/SKILL.md";
        const docs: Doc[] = [
            { path: own, text: "name: house-docs" },
            { path: "AGENTS.md", text: "| `house-docs` | Writing markdown |" },
        ];

        expect(documentedBy(skills([{ source: own, name: "house-docs" }])[0]!, docs)).toBe("AGENTS.md");
    });

    // Nearness alone sent skills to a sibling skill, and ranking alone to whichever README named them.
    it.each([
        { other: ".agents/skills/doc-drift-check/SKILL.md", text: "follow the house-docs skill" },
        { other: "infrastructure/scripts/src/drift/README.md", text: "per the `house-docs` skill's rules" },
    ])("sends a skill to the AGENTS.md table even when $other also names it", ({ other, text }) => {
        const docs: Doc[] = [
            { path: other, text },
            { path: "AGENTS.md", text: "| `house-docs` | Writing markdown |" },
        ];
        const capability = skills([{ source: ".agents/skills/house-docs/SKILL.md", name: "house-docs" }])[0]!;

        expect(documentedBy(capability, docs)).toBe("AGENTS.md");
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
            { path: "AGENTS.md", text: "the `pre-push` gate" },
            { path: "README.md", text: "The `pre-push` hook runs lint, test and typecheck" },
        ];

        expect(documentedBy(command("git push", ".husky/pre-push", "pre-push"), docs)).toBe("README.md");
    });
});
