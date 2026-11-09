import { describe, expect, it } from "vitest";
import {
    assembleWorkflows,
    capabilityState,
    projectView,
    readProject,
    readTemplate,
    type SnapshotIssue,
} from "./workflows.ts";

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

const issue = (number: number, caps: string[], overrides: Partial<SnapshotIssue> = {}) =>
    ({
        number,
        title: `#${number}`,
        url: "",
        state: "closed",
        reason: "completed",
        caps,
        closedAt: "2026-11-01T00:00:00Z",
        activity: [],
        ...overrides,
    }) satisfies SnapshotIssue;

const view = (project: object, issues: SnapshotIssue[], noMilestone: SnapshotIssue[] = []) =>
    projectView(readProject({ ...PROJECT, ...project }).project, readTemplate(TEMPLATE).template, {
        syncedAt: "2026-11-09T00:00:00Z",
        milestone: "Site",
        issues,
        noMilestone,
    });

const stateOf = (result: ReturnType<typeof view>, id: string) =>
    result.stages.flatMap((stage) => stage.capabilities).find((capability) => capability.id === id)
        ?.state;

describe("capabilityState", () => {
    it.each([
        ["switched off", false, null, [], "off"],
        ["settled without a ticket", true, "done", [], "done"],
        ["on with nothing filed", true, null, [], "todo"],
        [
            "filed and untouched",
            true,
            null,
            [issue(1, [], { state: "open", reason: null })],
            "planned",
        ],
        [
            "half delivered",
            true,
            null,
            [issue(1, []), issue(2, [], { state: "open", reason: null })],
            "in-progress",
        ],
        ["fully delivered", true, null, [issue(1, [])], "done"],
        ["only dropped tickets", true, null, [issue(1, [], { reason: "not_planned" })], "todo"],
    ] as const)("reads %s as %s", (_, enabled, settled, issues, expected) => {
        expect(capabilityState(enabled, settled, [...issues])).toBe(expected);
    });
});

describe("projectView", () => {
    it("counts only switched-on capabilities, so an opted-out feature never drags the percentage", () => {
        const result = view({}, [issue(1, ["content-audit"]), issue(2, ["article-page"])]);

        expect(stateOf(result, "comments")).toBe("off");
        expect(result.progress).toEqual({ done: 2, total: 3, percent: 67 });
    });

    it("leaves a skipped capability out of the total rather than counting it done", () => {
        const result = view({ settled: { "content-audit": { status: "skipped" } } }, []);

        expect(stateOf(result, "content-audit")).toBe("skipped");
        expect(result.progress.total).toBe(2);
        expect(result.progress.done).toBe(0);
    });

    it("keeps a finished stage current until its gate is approved, since a gate is a person's call", () => {
        const result = view({}, [issue(1, ["content-audit"])]);

        expect(result.stages.map((stage) => stage.state)).toEqual(["current", "upcoming"]);
    });

    it("moves past an approved stage even with a ticket still open on it", () => {
        const result = view({ gates: { discovery: "2026-09-30" } }, [
            issue(1, ["content-audit"], { state: "open", reason: null }),
        ]);

        expect(result.stages.map((stage) => stage.state)).toEqual(["done", "current"]);
        expect(result.left.map(({ id }) => id)).toEqual([
            "content-audit",
            "article-page",
            "search",
        ]);
    });

    it("lists what is left in stage order, leaving out what is done, skipped or off", () => {
        const result = view({ settled: { search: { status: "skipped", note: "" } } }, [
            issue(1, ["content-audit"]),
        ]);

        expect(result.left.map(({ id }) => id)).toEqual(["article-page"]);
    });

    it("puts an area ticket outside the milestone under To organise while the project runs", () => {
        const stray = issue(7, [], { state: "open", reason: null });

        expect(view({}, [], [stray]).unsorted).toEqual([
            { issue: stray, reason: "not in the milestone" },
        ]);
    });

    it("treats an area ticket outside the milestone as maintenance once every gate is approved", () => {
        const stray = issue(7, [], { state: "open", reason: null });
        const gates = { discovery: "2026-09-30", build: "2026-11-04" };

        expect(view({ gates }, [], [stray]).unsorted).toEqual([]);
    });

    it("sends issues it can't place to the unsorted list, but not closed history on a dropped capability", () => {
        const result = view({}, [
            issue(1, []),
            issue(2, ["nope"]),
            issue(3, ["comments"], { state: "open", reason: null }),
            issue(4, ["comments"]),
        ]);

        expect(result.unsorted.map(({ issue: { number }, reason }) => [number, reason])).toEqual([
            [1, "no cap: label"],
            [2, "unknown capability nope"],
            [3, "its capability is switched off"],
        ]);
    });

    it("always counts a project's own extra capabilities", () => {
        const result = view(
            { extras: [{ id: "calculator", stage: "build", title: "Calculator" }] },
            [issue(9, ["calculator"])],
        );

        expect(stateOf(result, "calculator")).toBe("done");
        expect(result.unsorted).toEqual([]);
    });
});

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

    it("flags an optional capability switched off under one that needs it", () => {
        const template = {
            ...TEMPLATE,
            capabilities: [
                ...TEMPLATE.capabilities,
                {
                    id: "newsletter",
                    stage: "build",
                    title: "Newsletter",
                    dependsOn: ["search"],
                },
            ],
        };
        const { problems } = assembleWorkflows(
            [parsed("website-rebuild.yaml", template)],
            [parsed("site.yaml", { ...PROJECT, switches: { search: false } })],
            {},
        );

        expect(problems.map((problem) => problem.message)).toEqual([
            "`newsletter` is on but needs `search`, which is switched off",
        ]);
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

describe("readTemplate", () => {
    it("catches a capability on a stage the template never declares", () => {
        const { problems } = readTemplate({
            ...TEMPLATE,
            capabilities: [{ id: "x", stage: "launch", title: "X" }],
        });

        expect(problems).toEqual([
            "capability `x` names stage `launch`, which the template doesn't have",
        ]);
    });

    it("reads an unquoted YAML date on a gate as the same day", () => {
        const { project } = readProject({
            ...PROJECT,
            gates: { discovery: new Date("2026-09-30") },
        });

        expect(project.gates).toEqual({ discovery: "2026-09-30" });
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

    const groupedView = (switches: Record<string, boolean>, issues: SnapshotIssue[] = []) =>
        projectView(readProject({ ...PROJECT, switches }).project, readTemplate(GROUPED).template, {
            syncedAt: "",
            milestone: "Site",
            issues,
            noMilestone: [],
        });

    it("switches every capability in a group off, whatever their own switches say", () => {
        const result = groupedView({ blog: false, comments: true });

        expect(stateOf(result, "article-page")).toBe("off");
        expect(stateOf(result, "comments")).toBe("off");
        expect(stateOf(result, "search")).toBe("todo");
        expect(result.groups).toEqual([expect.objectContaining({ id: "blog", enabled: false })]);
        expect(result.progress.total).toBe(2);
    });

    it("leaves each optional capability's own switch working while its group is on", () => {
        const result = groupedView({});

        expect(stateOf(result, "article-page")).toBe("todo");
        expect(stateOf(result, "comments")).toBe("off");
    });

    it("sends a ticket labelled with a group to To organise, since a group holds no tickets", () => {
        const result = groupedView({}, [issue(7, ["blog"], { state: "open", reason: null })]);

        expect(result.unsorted.map(({ reason }) => reason)).toEqual([
            "blog is a group; label one of its capabilities instead",
        ]);
    });

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

    it("catches a capability in an undeclared group, and a group sharing a capability's id", () => {
        const { problems } = readTemplate({
            ...TEMPLATE,
            groups: [{ id: "search", title: "Search" }],
            capabilities: [
                ...TEMPLATE.capabilities,
                { id: "feeds", stage: "build", title: "Feeds", group: "blog" },
            ],
        });

        expect(problems).toEqual([
            "group `search` shares its id with a capability, so a switch can't tell them apart",
            "capability `feeds` names group `blog`, which the template doesn't have",
        ]);
    });
});
