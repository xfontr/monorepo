import { describe, expect, it } from "vitest";
import { isEnabled, projectProblems, readProject } from "./project.ts";
import { readTemplate } from "./template.ts";

const PROJECT = {
    id: "site",
    title: "Site",
    template: "website-rebuild",
    milestone: "Site",
};

describe("readProject", () => {
    it("points a leftover gates: block at the owner block that replaced it", () => {
        expect(readProject({ ...PROJECT, gates: { discovery: "2026-09-30" } }).problems).toEqual([
            "`gates:` is gone: a gate is an `owner` block now, approved by closing its ticket or settling it as done",
        ]);
    });

    const { template } = readTemplate({
        id: "website-rebuild",
        title: "Website rebuild",
        stages: [{ id: "build", title: "Build" }],
        capabilities: [
            { id: "page-layout", stage: "build", title: "Page layout" },
            { id: "component-kit", stage: "build", title: "Component kit" },
        ],
        types: [
            {
                id: "custom-page",
                stage: "build",
                title: "Custom page",
                complexity: 5,
                dependsOn: ["page-layout"],
                doneWhen: ["It matches the approved design."],
            },
        ],
    });

    it("gives an extra its type's stage, estimate and criteria, and keeps both lists of needs", () => {
        const { project, problems } = readProject(
            {
                ...PROJECT,
                extras: [
                    {
                        id: "services",
                        type: "custom-page",
                        title: "Services",
                        dependsOn: ["component-kit"],
                    },
                ],
            },
            template.types,
        );

        expect(problems).toEqual([]);
        expect(project.extras[0]).toMatchObject({
            id: "services",
            title: "Services",
            stage: "build",
            complexity: 5,
            dependsOn: ["page-layout", "component-kit"],
            doneWhen: ["It matches the approved design."],
        });
    });

    it("reports an extra naming a type the template doesn't have, instead of guessing its stage", () => {
        const { problems } = readProject(
            { ...PROJECT, extras: [{ id: "services", type: "landing-page", title: "Services" }] },
            template.types,
        );

        expect(problems).toContain(
            "extra `services` names type `landing-page`, which the template doesn't have",
        );
    });
});

describe("on-demand blocks", () => {
    const { template } = readTemplate({
        id: "site",
        title: "Site",
        stages: [{ id: "build", title: "Build" }],
        capabilities: [{ id: "comments", stage: "build", title: "Comments setup", onDemand: true }],
        types: [
            { id: "blog", stage: "build", title: "Blog" },
            {
                id: "blog-comments",
                stage: "build",
                title: "Blog + comments",
                dependsOn: ["comments"],
            },
        ],
    });
    const comments = template.capabilities[0]!;
    const project = (extras: unknown[], switches = {}) =>
        readProject({ ...PROJECT, template: "site", extras, switches }, template.types).project;

    it("joins the map only while a page depends on it, however many pages do", () => {
        expect(
            isEnabled(comments, project([{ id: "news", type: "blog", title: "News" }]), template),
        ).toBe(false);
        expect(
            isEnabled(
                comments,
                project([
                    { id: "news", type: "blog-comments", title: "News" },
                    { id: "notes", type: "blog-comments", title: "Notes" },
                ]),
                template,
            ),
        ).toBe(true);
    });

    it("refuses a switch on it, since the pages decide", () => {
        expect(projectProblems(project([], { comments: true }), template)).toEqual([
            "switch `comments` is on a block that comes in with the pages that need it",
        ]);
    });

    it("refuses one marked optional too, which would give it a switch again", () => {
        expect(
            readTemplate({
                id: "site",
                title: "Site",
                stages: [{ id: "build", title: "Build" }],
                capabilities: [
                    {
                        id: "comments",
                        stage: "build",
                        title: "Comments",
                        onDemand: true,
                        optional: true,
                    },
                ],
            }).problems,
        ).toContain(
            "capability `comments`: an `onDemand` block has no switch, so it can't be `optional`",
        );
    });
});
