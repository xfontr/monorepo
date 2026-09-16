import { describe, expect, it } from "vitest";
import { resolveDocLink } from "./docLinks.ts";

/**
 * Stands in for what the remark plugin asks the filesystem: the target as the link writes it, so an
 * extension-less entry is a doc whose link omits `.md`.
 */
const COLLECTED = new Set([
    "README.md",
    "docs/README.md",
    "docs/decisions/README.md",
    "docs/decisions/0011-docs-system-enforcement.md",
    "apps/tech-docs/README.md",
    ".claude/skills/writing-tests/SKILL.md",
    ".claude/skills/house-docs/SKILL",
]);

const isPage = (path: string): boolean => COLLECTED.has(path);

/** `CLAUDE.md` at the repo root, whose links are relative to the root itself. */
const ROOT = "CLAUDE.md";

const DECISION = "docs/decisions/0014-tech-docs-deployment.md";

describe("resolveDocLink", () => {
    it("routes a markdown sibling to its lower-cased collection path, not the name on disk", () => {
        expect(resolveDocLink("./README.md", ROOT, isPage)).toBe("/docs/readme");
    });

    it("resolves a markdown link against the linking file's directory rather than the route", () => {
        expect(resolveDocLink("./0011-docs-system-enforcement.md", DECISION, isPage))
            .toBe("/docs/docs/decisions/0011-docs-system-enforcement");
    });

    it("walks out of the directory on `..` so a cross-tree link lands in the right place", () => {
        expect(resolveDocLink("../../apps/tech-docs/README.md", DECISION, isPage))
            .toBe("/docs/apps/tech-docs/readme");
    });

    it("keeps an anchor, which names a heading on the page it just resolved", () => {
        expect(resolveDocLink("./README.md#-numbering", DECISION, isPage))
            .toBe("/docs/docs/decisions/readme#-numbering");
    });

    it("sends a file the collection never renders to the repo instead of a route", () => {
        expect(resolveDocLink("./.husky/pre-push", ROOT, isPage)).toBe("repo:.husky/pre-push");
        expect(resolveDocLink("./nx.json", ROOT, isPage)).toBe("repo:nx.json");
    });

    it("keeps a file's real casing, because only the markdown half is lower-cased", () => {
        expect(resolveDocLink("./packages/configs/src/tsconfig/base.json", ROOT, isPage))
            .toBe("repo:packages/configs/src/tsconfig/base.json");
    });

    it("drops a line range, which narrows a file rather than naming another one", () => {
        expect(resolveDocLink("./.claude/skills/writing-tests/SKILL.md:91-94", ROOT, isPage))
            .toBe("/docs/.claude/skills/writing-tests/skill");
    });

    it("treats a leading slash as repo-root-relative, not directory-relative", () => {
        expect(resolveDocLink("/docs/README.md", DECISION, isPage)).toBe("/docs/docs/readme");
    });

    it("leaves a link nothing here owns to the renderer's own handling", () => {
        expect(resolveDocLink("https://example.com", ROOT, isPage)).toBeNull();
        expect(resolveDocLink("mailto:someone@example.com", ROOT, isPage)).toBeNull();
        expect(resolveDocLink("#-structure", ROOT, isPage)).toBeNull();
        expect(resolveDocLink("", ROOT, isPage)).toBeNull();
    });

    it("ignores a template's `<placeholder>`, which is instructions rather than a link", () => {
        expect(resolveDocLink("<new-file>.md", "docs/decisions/TEMPLATE.md", isPage)).toBeNull();
    });

    it("routes an extension-less target the collection knows, since these docs may omit `.md`", () => {
        expect(resolveDocLink("./.claude/skills/house-docs/SKILL", ROOT, isPage))
            .toBe("/docs/.claude/skills/house-docs/skill");
    });

    it("sends an extension-less target the collection does not know to the repo, not a dead route", () => {
        expect(resolveDocLink("./.claude/agents", ROOT, isPage)).toBe("repo:.claude/agents");
    });

    it("sends a markdown target the collection does not have to the repo, so no link renders a soft 404", () => {
        expect(resolveDocLink("./docs/GONE.md", ROOT, isPage)).toBe("repo:docs/GONE.md");
    });
});
