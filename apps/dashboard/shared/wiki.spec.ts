import { describe, expect, it } from "vitest";
import { buildWiki, locate, stripLeadingEmoji, toCollectionPath } from "./wiki.ts";

const PAGES = [
    { path: "/readme", title: "Monorepo" },
    { path: "/claude", title: "🤖 Working in this repo" },
    { path: "/docs/readme", title: "🗂 Docs" },
    { path: "/docs/features", title: "🗺 Features" },
    { path: "/docs/guides/first-hour", title: "🌱 First hour in this repo" },
    { path: "/docs/concepts/readme", title: "🧠 Concepts" },
    { path: "/docs/concepts/boundaries", title: "🧱 Why the boundary system exists" },
    { path: "/docs/reviews/scorecards", title: "🎯 Scorecards" },
    { path: "/docs/reviews/2026-09-05-abcb17d", title: "📊 Review — 2026-09-05" },
    { path: "/docs/spikes/template", title: "🧭" },
    { path: "/packages/ui/readme", title: "📦 @monorepo/ui" },
    { path: "/packages/ui/claude", title: "🤖 @monorepo/ui" },
    { path: "/packages/ui/changelog", title: "CHANGELOG" },
    { path: "/packages/ui/.claude/skills/new-component/skill", title: "Adding a UI component" },
    { path: "/packages/content/src/nuxt/readme", title: "🟢 @monorepo/content/nuxt" },
    { path: "/.claude/skills/house-docs/skill", title: "Writing docs here" },
];

function sectionOf(id: string) {
    return buildWiki(PAGES).find((section) => section.id === id);
}

function labelsIn(id: string, group: string): string[] {
    return sectionOf(id)?.groups.find((entry) => entry.key === group)?.entries.map((entry) => entry.label) ?? [];
}

describe("buildWiki", () => {
    it("files a project's nested README under the project, not as a project of its own", () => {
        expect(labelsIn("projects", "packages/content")).toEqual(["src/nuxt"]);
    });

    it("labels a project's own README 'Overview', because the group already carries the package name", () => {
        expect(labelsIn("projects", "packages/ui")).toEqual(["Overview", "Agent notes", "Adding a UI component"]);
    });

    it("keeps a project's skill with that project rather than with the root agent setup", () => {
        expect(labelsIn("agents", "skills")).toEqual(["Writing docs here"]);
    });

    it("drops the changelogs and the dated reviews, which have pages of their own in this app", () => {
        const paths = buildWiki(PAGES).flatMap((section) => section.groups.flatMap((group) => group.entries.map((entry) => entry.path)));

        expect(paths).not.toContain("/packages/ui/changelog");
        expect(paths).not.toContain("/docs/reviews/2026-09-05-abcb17d");
    });

    it("drops a TEMPLATE, whose placeholder heading survives @nuxt/content as a blank or truncated title", () => {
        const paths = buildWiki(PAGES).flatMap((section) => section.groups.flatMap((group) => group.entries.map((entry) => entry.path)));

        expect(paths).not.toContain("/docs/spikes/template");
    });

    it("keeps the rubric, which is a doc about how a review is written rather than a review", () => {
        expect(labelsIn("docs", "reviews")).toEqual(["Scorecards"]);
    });

    it("sorts the docs tree's own pages above its subdirectories, so the map comes before the territory", () => {
        expect(sectionOf("docs")?.groups.map((group) => group.key)).toEqual(["docs", "concepts", "guides", "reviews"]);
    });

    it("orders projects apps-first, matching how the README lays the workspace out", () => {
        expect(sectionOf("projects")?.groups.map((group) => group.key)).toEqual(["packages/content", "packages/ui"]);
    });

    it("drops a section nothing landed in instead of rendering an empty heading", () => {
        expect(buildWiki([{ path: "/readme", title: "Monorepo" }]).map((section) => section.id)).toEqual(["workspace"]);
    });
});

describe("stripLeadingEmoji", () => {
    it("keeps a title that opens with a package name, which is not decoration", () => {
        expect(stripLeadingEmoji("@monorepo/ui")).toBe("@monorepo/ui");
    });

    it("strips the emoji the house style opens every heading with", () => {
        expect(stripLeadingEmoji("🧱 Why the boundary system exists")).toBe("Why the boundary system exists");
    });
});

describe("toCollectionPath", () => {
    it("lower-cases the collector's path, which is the one thing that silently matches nothing", () => {
        expect(toCollectionPath("packages/ui/README.md")).toBe("/packages/ui/readme");
    });

    it("keeps a path that is already lower-case intact, so a doc under docs/ is not mangled", () => {
        expect(toCollectionPath("docs/guides/first-hour.md")).toBe("/docs/guides/first-hour");
    });
});

describe("locate", () => {
    it("finds the section and group a page sits in, which is the breadcrumb above it", () => {
        const found = locate(buildWiki(PAGES), "/docs/concepts/boundaries");

        expect([found?.section.id, found?.group.key]).toEqual(["docs", "concepts"]);
    });

    it("returns null for a path no section claims, so a stale link renders a not-found instead of throwing", () => {
        expect(locate(buildWiki(PAGES), "/nope")).toBeNull();
    });
});
