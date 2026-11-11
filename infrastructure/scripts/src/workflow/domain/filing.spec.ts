import { describe, expect, it } from "vitest";
import { bundleFor, bundlesOf, planFiling, readMap, toFile } from "./filing.ts";
import type { SnapshotIssue } from "./snapshot.ts";

const TEMPLATE = {
    groups: [{ id: "blog", optional: true, default: true }],
    capabilities: [
        { id: "design-approval", title: "Design approval", kind: "owner" },
        { id: "component-kit", title: "Component kit", dependsOn: ["design-approval"] },
        {
            id: "article-page",
            title: "Article page",
            group: "blog",
            summary: "The page readers land on.",
            dependsOn: ["component-kit"],
            doneWhen: ["It renders a real article."],
        },
        {
            id: "comments",
            title: "Comments",
            optional: true,
            default: false,
            dependsOn: ["article-page"],
            tickets: [{ title: "Build comments", criteria: ["Readers can post."] }],
        },
    ],
};

const PROJECT = { milestone: "Site", area: "app:site", switches: { comments: true } };

const ticket = (
    number: number,
    cap: string,
    overrides: Partial<SnapshotIssue> = {},
): SnapshotIssue => ({
    number,
    title: `#${number}`,
    url: "",
    state: "open",
    reason: null,
    caps: [cap],
    createdAt: "2026-10-01T00:00:00Z",
    closedAt: null,
    activity: [],
    blockedBy: [],
    branch: false,
    owner: false,
    complexity: null,
    ...overrides,
});

const closed = (number: number, cap: string) =>
    ticket(number, cap, { state: "closed", reason: "completed" });

describe("planFiling", () => {
    it("refuses a block while the decision it needs is still open", () => {
        const filing = planFiling(
            readMap(TEMPLATE, PROJECT),
            [ticket(1, "design-approval")],
            ["component-kit"],
        );

        expect(filing).toEqual({
            ok: false,
            reason: "`component-kit` waits on design-approval (owner, open: #1)",
        });
    });

    it("refuses a block whose build need has nothing filed, since there is no ticket to link to", () => {
        const filing = planFiling(
            readMap(TEMPLATE, PROJECT),
            [closed(1, "design-approval")],
            ["article-page"],
        );

        expect(filing).toEqual({
            ok: false,
            reason: "`article-page` waits on component-kit (nothing filed yet)",
        });
    });

    it("links a new ticket to every open ticket of a build block it needs", () => {
        const filing = planFiling(
            readMap(TEMPLATE, PROJECT),
            [closed(1, "component-kit"), ticket(3, "component-kit"), ticket(2, "component-kit")],
            ["article-page"],
        );

        expect(filing).toEqual({
            ok: true,
            tickets: [
                {
                    title: "Article page",
                    body: "The page readers land on.\n\n**Acceptance criteria:**\n\n- [ ] It renders a real article.\n\nFiled from the workflow map, block `article-page`.",
                    labels: ["cap:article-page", "app:site", "enhancement"],
                    blockedBy: [2, 3],
                    complexity: null,
                },
            ],
        });
    });

    it("labels an owner block's ticket so it lands under Waiting on you", () => {
        const filing = planFiling(readMap(TEMPLATE, PROJECT), [], ["design-approval"]);

        expect(filing.ok && filing.tickets[0]?.labels).toEqual([
            "cap:design-approval",
            "app:site",
            "owner",
        ]);
    });

    it("drops a need switched off with its group instead of waiting on it forever", () => {
        const map = readMap(TEMPLATE, { ...PROJECT, switches: { blog: false, comments: true } });

        expect(planFiling(map, [], ["comments"])).toMatchObject({ ok: true });
        expect(planFiling(map, [], ["article-page"])).toEqual({
            ok: false,
            reason: "`article-page` is switched off",
        });
    });

    it("refuses to file a block twice", () => {
        expect(
            planFiling(
                readMap(TEMPLATE, PROJECT),
                [ticket(5, "design-approval")],
                ["design-approval"],
            ),
        ).toEqual({
            ok: false,
            reason: "`design-approval` already has #5",
        });
    });
});

const STAGED = {
    capabilities: [
        { id: "audit", stage: "discovery", title: "Audit", kind: "spike" },
        { id: "hosting", stage: "discovery", title: "Hosting", kind: "spike" },
        {
            id: "signoff",
            stage: "discovery",
            title: "Sign-off",
            kind: "owner",
            dependsOn: ["audit"],
        },
        { id: "tokens", stage: "design", title: "Tokens" },
        { id: "lab", stage: "design", title: "Lab", dependsOn: ["tokens"] },
        { id: "approval", stage: "design", title: "Approval", kind: "owner", dependsOn: ["lab"] },
        { id: "inventory", stage: "design", title: "Inventory", dependsOn: ["approval"] },
        {
            id: "scaffold",
            stage: "foundations",
            title: "Scaffold",
            summary: "An app that builds.",
            doneWhen: ["It builds."],
            complexity: 2,
        },
        {
            id: "deploy",
            stage: "foundations",
            title: "Deploy",
            summary: "Previews on every PR.",
            dependsOn: ["scaffold", "signoff", "tokens"],
            tickets: [{ title: "Wire deploys", criteria: ["A PR gets a preview."] }],
            complexity: 3,
        },
    ],
};

const staged = (ticketSize: string) => readMap(STAGED, { ...PROJECT, ticketSize });

describe("bundlesOf", () => {
    it("splits a stage's build blocks where an owner block inside the stage sits between them", () => {
        const map = staged("stage");

        expect(bundlesOf(toFile(map, []), map.ticketSize)).toEqual([
            ["audit"],
            ["hosting"],
            ["signoff"],
            ["tokens", "lab"],
            ["approval"],
            ["inventory"],
            ["scaffold", "deploy"],
        ]);
    });

    it("puts every spike in one ticket only when the size is lean", () => {
        const map = staged("lean");

        expect(bundlesOf(toFile(map, []), map.ticketSize)[0]).toEqual(["audit", "hosting"]);
    });

    it("keeps one ticket per block when the project sets no size", () => {
        const map = readMap(STAGED, PROJECT);

        expect(bundlesOf(toFile(map, []), map.ticketSize)).toHaveLength(9);
    });
});

describe("planFiling several blocks", () => {
    it("drops a need filed in the same ticket and links only the ones outside it", () => {
        const filing = planFiling(
            staged("stage"),
            [closed(1, "signoff"), ticket(7, "tokens")],
            ["scaffold", "deploy"],
        );

        expect(filing).toEqual({
            ok: true,
            tickets: [
                {
                    title: "Scaffold, Deploy",
                    body: "### Scaffold\n\nAn app that builds.\n\n**Acceptance criteria:**\n\n- [ ] It builds.\n\n### Deploy\n\nPreviews on every PR.\n\n**Acceptance criteria:**\n\n- [ ] A PR gets a preview.\n\nFiled from the workflow map, blocks `scaffold`, `deploy`.",
                    labels: ["cap:scaffold", "cap:deploy", "app:site", "enhancement"],
                    blockedBy: [7],
                    complexity: 5,
                },
            ],
        });
    });

    it("estimates a block filed alone with the template's figure for the block", () => {
        const filing = planFiling(
            staged("block"),
            [closed(1, "signoff"), ticket(7, "scaffold"), ticket(8, "tokens")],
            ["deploy"],
        );

        expect(filing.ok && filing.tickets[0]?.complexity).toBe(3);
    });

    it("refuses to put a spike in the same ticket as build work", () => {
        expect(planFiling(staged("stage"), [], ["audit", "tokens"])).toEqual({
            ok: false,
            reason: "only build blocks share a ticket with each other, and spikes with spikes",
        });
    });
});

describe("bundleFor", () => {
    it("leaves a member out while the decision it needs is open, instead of refusing the bundle", () => {
        expect(bundleFor(staged("stage"), [ticket(1, "signoff")], "scaffold")).toEqual({
            ids: ["scaffold"],
            later: ["`deploy` waits on signoff (owner, open: #1); tokens (nothing filed yet)"],
        });
    });
});
