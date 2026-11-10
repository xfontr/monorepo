import { describe, expect, it } from "vitest";
import {
    assembleWorkflows,
    dependencyCycle,
    issueAsOf,
    projectView,
    readProject,
    readTemplate,
    replayRange,
    ticketStatus,
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
        createdAt: "2026-10-01T00:00:00Z",
        closedAt: "2026-11-01T00:00:00Z",
        activity: [],
        blockedBy: [],
        branch: false,
        owner: false,
        ...overrides,
    }) satisfies SnapshotIssue;

const open = (number: number, caps: string[], overrides: Partial<SnapshotIssue> = {}) =>
    issue(number, caps, { state: "open", reason: null, closedAt: null, ...overrides });

const view = (
    project: object,
    issues: SnapshotIssue[],
    noMilestone: SnapshotIssue[] = [],
    template: object = TEMPLATE,
    asOf: string | null = null,
) =>
    projectView(
        readProject({ ...PROJECT, ...project }).project,
        readTemplate(template).template,
        { syncedAt: "2026-11-09T00:00:00Z", milestone: "Site", issues, noMilestone },
        asOf,
    );

const capabilityOf = (result: ReturnType<typeof view>, id: string) =>
    result.capabilities.find((capability) => capability.id === id);

const stateOf = (result: ReturnType<typeof view>, id: string) =>
    result.stages.flatMap((stage) => stage.capabilities).find((capability) => capability.id === id)
        ?.state;

describe("block status", () => {
    const CHAIN = {
        ...TEMPLATE,
        capabilities: [
            { id: "kit", stage: "build", title: "Kit" },
            { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
            { id: "sign-off", stage: "build", title: "Sign-off", kind: "owner" },
        ],
    };

    it.each([
        ["nothing filed and nothing it needs open", [], "kit", "can-file"],
        ["its tickets all delivered", [issue(1, ["kit"])], "kit", "done"],
        ["an open ticket with nothing in the way", [open(1, ["kit"])], "kit", "ready"],
        [
            "an open ticket someone has a branch on",
            [open(1, ["kit"], { branch: true })],
            "kit",
            "in-flight",
        ],
        [
            "an open ticket a commit names",
            [open(1, ["kit"], { activity: ["2026-10-02"] })],
            "kit",
            "in-flight",
        ],
        [
            "tickets while a block it needs is unfinished",
            [open(1, ["kit"]), open(2, ["page"])],
            "page",
            "blocked",
        ],
        [
            "tickets whose GitHub blockers are all open",
            [open(2, ["kit"], { blockedBy: [{ number: 9, open: true, closedAt: null }] })],
            "kit",
            "blocked",
        ],
        ["an owner block with nothing in its way", [], "sign-off", "waiting-on-you"],
        ["only dropped tickets", [issue(1, ["kit"], { reason: "not_planned" })], "kit", "can-file"],
    ] as const)("reads a block with %s as %s", (_, issues, id, expected) => {
        expect(capabilityOf(view({}, [...issues], [], CHAIN), id)?.state).toBe(expected);
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

    it("holds back filing behind an open decision, but not behind a build block that has tickets", () => {
        const template = {
            ...TEMPLATE,
            capabilities: [
                { id: "design-approval", stage: "discovery", title: "Design", kind: "owner" },
                { id: "content-audit", stage: "discovery", title: "Audit" },
                {
                    id: "article-page",
                    stage: "build",
                    title: "Article",
                    dependsOn: ["design-approval", "content-audit"],
                },
                { id: "search", stage: "build", title: "Search", dependsOn: ["content-audit"] },
            ],
        };
        const result = view(
            {},
            [open(1, ["design-approval"]), open(2, ["content-audit"])],
            [],
            template,
        );
        const article = result.stages[1]?.capabilities.find(({ id }) => id === "article-page");

        expect(article?.state).toBe("waits");
        expect(article?.waitingOn).toEqual(["design-approval", "content-audit"]);
        expect(stateOf(result, "search")).toBe("can-file");
    });

    it("holds back filing behind a build block with nothing filed, since there is no ticket to link to", () => {
        const template = {
            ...TEMPLATE,
            capabilities: [
                { id: "content-audit", stage: "discovery", title: "Audit" },
                { id: "search", stage: "build", title: "Search", dependsOn: ["content-audit"] },
            ],
        };

        expect(stateOf(view({}, [], [], template), "search")).toBe("waits");
        expect(stateOf(view({}, [issue(1, ["content-audit"])], [], template), "search")).toBe(
            "can-file",
        );
    });

    it("routes round a switched-off block, so what needed it waits on what it needed", () => {
        const template = {
            ...TEMPLATE,
            capabilities: [
                { id: "kit", stage: "build", title: "Kit" },
                {
                    id: "search",
                    stage: "build",
                    title: "Search",
                    optional: true,
                    dependsOn: ["kit"],
                },
                { id: "seo", stage: "build", title: "SEO", dependsOn: ["search"] },
            ],
        };
        const result = view({ switches: { search: false } }, [], [], template);

        expect(capabilityOf(result, "seo")?.needs).toEqual(["kit"]);
        expect(capabilityOf(result, "kit")?.unblocks).toEqual(["seo"]);
    });

    it("lists what's left with the owner's first, then most-unblocking first", () => {
        const template = {
            ...TEMPLATE,
            capabilities: [
                { id: "a", stage: "build", title: "A" },
                { id: "b", stage: "build", title: "B" },
                { id: "c", stage: "build", title: "C", dependsOn: ["b"] },
                { id: "d", stage: "build", title: "D", dependsOn: ["c"] },
                { id: "yours", stage: "build", title: "Yours", kind: "owner" },
            ],
        };
        const result = view(
            {},
            [open(1, ["a"]), open(2, ["b"]), open(3, ["c"]), open(4, ["d"])],
            [],
            template,
        );

        expect(result.left.map(({ id, unblockCount }) => [id, unblockCount])).toEqual([
            ["yours", 0],
            ["b", 2],
            ["a", 0],
            ["c", 1],
            ["d", 0],
        ]);
        expect(result.critical).toEqual(["b", "c", "d"]);
    });

    it("puts an area ticket outside the milestone under To organise while the project runs", () => {
        const stray = issue(7, [], { state: "open", reason: null });

        expect(view({}, [], [stray]).unsorted).toEqual([
            { issue: stray, reason: "not in the milestone" },
        ]);
    });

    it("treats an area ticket outside the milestone as maintenance once everything on is delivered", () => {
        const stray = open(7, []);
        const delivered = [
            issue(1, ["content-audit"]),
            issue(2, ["article-page"]),
            issue(3, ["search"]),
        ];

        expect(view({}, delivered, [stray]).unsorted).toEqual([]);
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

    it("catches a loop of dependsOn links, which no order could ever satisfy", () => {
        const { problems } = readTemplate({
            ...TEMPLATE,
            capabilities: [
                { id: "a", stage: "build", title: "A", dependsOn: ["c"] },
                { id: "b", stage: "build", title: "B", dependsOn: ["a"] },
                { id: "c", stage: "build", title: "C", dependsOn: ["b"] },
            ],
        });

        expect(problems).toEqual(["`dependsOn` goes round in a loop: a → c → b → a"]);
    });

    it("refuses a kind outside build, spike and owner", () => {
        const { problems } = readTemplate({
            ...TEMPLATE,
            capabilities: [{ id: "x", stage: "build", title: "X", kind: "epic" }],
        });

        expect(problems).toEqual(["capability `x`: `kind: epic` isn't one of build, spike, owner"]);
    });

    it("points a leftover gates: block at the owner block that replaced it", () => {
        expect(readProject({ ...PROJECT, gates: { discovery: "2026-09-30" } }).problems).toEqual([
            "`gates:` is gone: a gate is an `owner` block now, approved by closing its ticket or settling it as done",
        ]);
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
        expect(stateOf(result, "search")).toBe("can-file");
        expect(result.features.find(({ id }) => id === "blog")?.enabled).toBe(false);
        expect(result.progress.total).toBe(2);
    });

    it("lists the blog and every optional block as one flat set of features", () => {
        expect(
            groupedView({}).features.map(({ id, enabled, within }) => [id, enabled, within]),
        ).toEqual([
            ["blog", true, null],
            ["comments", false, "blog"],
            ["search", true, null],
        ]);
    });

    it("leaves each optional capability's own switch working while its group is on", () => {
        const result = groupedView({});

        expect(stateOf(result, "article-page")).toBe("can-file");
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

describe("ticketStatus", () => {
    it.each([
        ["closed as completed", issue(1, []), "done"],
        ["closed as not planned", issue(1, [], { reason: "not_planned" }), "dropped"],
        [
            "open on a linked branch, even if blocked",
            open(1, [], { branch: true, blockedBy: [{ number: 2, open: true, closedAt: null }] }),
            "in-flight",
        ],
        [
            "open behind an open blocker",
            open(1, [], { blockedBy: [{ number: 2, open: true, closedAt: null }] }),
            "blocked",
        ],
        [
            "open behind closed blockers only",
            open(1, [], { blockedBy: [{ number: 2, open: false, closedAt: null }] }),
            "ready",
        ],
        ["open, unblocked and the owner's", open(1, [], { owner: true }), "waiting-on-you"],
    ] as const)("reads a ticket %s as %s", (_, subject, expected) => {
        expect(ticketStatus(subject)).toBe(expected);
    });
});

describe("replay", () => {
    const REPLAYED = {
        ...TEMPLATE,
        capabilities: [
            { id: "kit", stage: "build", title: "Kit" },
            { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
            { id: "sign-off", stage: "build", title: "Sign-off", kind: "owner" },
        ],
    };
    const HISTORY = [
        issue(1, ["kit"], {
            createdAt: "2026-10-01T09:00:00Z",
            closedAt: "2026-10-10T09:00:00Z",
            activity: ["2026-10-05"],
        }),
        issue(2, ["page"], {
            createdAt: "2026-10-08T09:00:00Z",
            closedAt: "2026-10-20T09:00:00Z",
            activity: ["2026-10-15"],
        }),
    ];

    it("shows a past day as it stood: fileable, in flight, blocked behind it, then done", () => {
        const on = (day: string) => {
            const result = view({}, HISTORY, [], REPLAYED, day);
            return [capabilityOf(result, "kit")?.state, capabilityOf(result, "page")?.state];
        };

        expect(on("2026-10-02")).toEqual(["ready", "can-file"]);
        expect(on("2026-10-06")).toEqual(["in-flight", "can-file"]);
        expect(on("2026-10-09")).toEqual(["in-flight", "blocked"]);
        expect(on("2026-10-12")).toEqual(["done", "ready"]);
        expect(on("2026-10-21")).toEqual(["done", "done"]);
    });

    it("counts a settled block only from the day it was settled", () => {
        const project = { settled: { "sign-off": { status: "done", note: "", on: "2026-10-15" } } };

        expect(capabilityOf(view(project, [], [], REPLAYED, "2026-10-14"), "sign-off")?.state).toBe(
            "waiting-on-you",
        );
        expect(capabilityOf(view(project, [], [], REPLAYED, "2026-10-15"), "sign-off")?.state).toBe(
            "done",
        );
    });

    it("reopens a blocker that closed after the day replayed, and drops a branch only the sync saw", () => {
        const replayed = issueAsOf(
            open(5, [], {
                branch: true,
                blockedBy: [{ number: 4, open: false, closedAt: "2026-10-20T00:00:00Z" }],
            }),
            "2026-10-10",
            "2026-11-09",
        );

        expect(replayed?.blockedBy[0]?.open).toBe(true);
        expect(replayed?.branch).toBe(false);
        expect(
            issueAsOf(open(6, [], { createdAt: "2026-10-11T00:00:00Z" }), "2026-10-10", null),
        ).toBeNull();
    });

    it("runs from the first commit on a ticket to the day of the sync", () => {
        expect(
            replayRange({
                syncedAt: "2026-11-09T10:00:00Z",
                milestone: "Site",
                issues: HISTORY,
                noMilestone: [],
            }),
        ).toEqual({ first: "2026-10-05", last: "2026-11-09" });
        expect(
            replayRange({
                syncedAt: "2026-11-09T10:00:00Z",
                milestone: "Site",
                issues: [],
                noMilestone: [],
            }),
        ).toBeNull();
    });
});

describe("dependencyCycle", () => {
    it("finds no loop in a chain that only runs one way", () => {
        expect(
            dependencyCycle(
                readTemplate({
                    ...TEMPLATE,
                    capabilities: [
                        { id: "a", stage: "build", title: "A" },
                        { id: "b", stage: "build", title: "B", dependsOn: ["a"] },
                    ],
                }).template.capabilities,
            ),
        ).toBeNull();
    });
});
