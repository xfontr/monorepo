import { describe, expect, it } from "vitest";
import { assembleWorkflows } from "./directory.ts";

const TEMPLATE = {
    id: "website-rebuild",
    title: "Website rebuild",
    stages: [
        { id: "discovery", title: "Discovery" },
        { id: "build", title: "Build" },
    ],
    capabilities: [
        { id: "content-audit", stage: "discovery", title: "Content audit" },
        { id: "article-page", stage: "build", title: "Article page" },
        { id: "comments", stage: "build", title: "Comments", optional: true, default: false },
        { id: "search", stage: "build", title: "Search", optional: true, default: true },
    ],
};

const PROJECT = {
    id: "site",
    title: "Site",
    template: "website-rebuild",
    milestone: "Site",
};

describe("assembleWorkflows", () => {
    const parsed = (file: string, value: unknown) => ({ file, ok: true as const, value });

    it("reports a project naming a missing template instead of dropping it silently", () => {
        const { projects, problems } = assembleWorkflows(
            [parsed("website-rebuild.yaml", TEMPLATE)],
            [parsed("site.yaml", { ...PROJECT, template: "other" })],
            {},
        );

        expect(projects).toEqual([]);
        expect(problems).toEqual([
            { file: "projects/site.yaml", message: "`template: other` names no template" },
        ]);
    });

    it("rejects a switch on a required capability, which would read as opting out of it", () => {
        const { problems } = assembleWorkflows(
            [parsed("website-rebuild.yaml", TEMPLATE)],
            [parsed("site.yaml", { ...PROJECT, switches: { "article-page": false } })],
            {},
        );

        expect(problems.map((problem) => problem.message)).toEqual([
            "switch `article-page` is on a required capability",
        ]);
    });

    it("raises no problem for a need switched off, since the map routes round it", () => {
        const template = {
            ...TEMPLATE,
            capabilities: [
                ...TEMPLATE.capabilities,
                { id: "newsletter", stage: "build", title: "Newsletter", dependsOn: ["search"] },
            ],
        };
        const { problems } = assembleWorkflows(
            [parsed("website-rebuild.yaml", template)],
            [parsed("site.yaml", { ...PROJECT, switches: { search: false } })],
            {},
        );

        expect(problems).toEqual([]);
    });

    it("reports a malformed snapshot and still renders the project", () => {
        const { projects, problems } = assembleWorkflows(
            [parsed("website-rebuild.yaml", TEMPLATE)],
            [parsed("site.yaml", PROJECT)],
            {
                site: parsed("site.snapshot.json", {
                    syncedAt: "2026-11-09T00:00:00Z",
                    milestone: "Site",
                    issues: [{ number: 3, state: "open" }, { title: "no number" }],
                }),
            },
        );

        expect(projects[0]?.unsorted.map(({ issue: { number } }) => number)).toEqual([3]);
        expect(problems).toEqual([
            {
                file: "projects/site.snapshot.json",
                message: "`issues` holds an issue without a number",
            },
        ]);
    });

    it("keeps rendering the other files when one doesn't parse", () => {
        const { projects, problems } = assembleWorkflows(
            [parsed("website-rebuild.yaml", TEMPLATE)],
            [{ file: "broken.yaml", ok: false, error: "bad indent" }, parsed("site.yaml", PROJECT)],
            {},
        );

        expect(projects.map(({ project }) => project.id)).toEqual(["site"]);
        expect(problems).toEqual([{ file: "projects/broken.yaml", message: "bad indent" }]);
    });
});

describe("groups", () => {
    const GROUPED = {
        ...TEMPLATE,
        groups: [{ id: "blog", title: "Blog", optional: true, default: true }],
        capabilities: TEMPLATE.capabilities.map((capability) =>
            ["article-page", "comments"].includes(capability.id)
                ? { ...capability, group: "blog" }
                : capability,
        ),
    };

    it("accepts a switch on an optional group and refuses one on a required group", () => {
        const required = {
            ...GROUPED,
            groups: [{ id: "blog", title: "Blog" }],
        };
        const parsed = (file: string, value: unknown) => ({ file, ok: true as const, value });

        const optional = assembleWorkflows(
            [parsed("website-rebuild.yaml", GROUPED)],
            [parsed("site.yaml", { ...PROJECT, switches: { blog: false } })],
            {},
        );
        const refused = assembleWorkflows(
            [parsed("website-rebuild.yaml", required)],
            [parsed("site.yaml", { ...PROJECT, switches: { blog: false } })],
            {},
        );

        expect(optional.problems).toEqual([]);
        expect(refused.problems.map(({ message }) => message)).toEqual([
            "switch `blog` is on a required group",
        ]);
    });
});
