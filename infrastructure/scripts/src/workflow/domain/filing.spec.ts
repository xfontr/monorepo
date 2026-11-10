import { describe, expect, it } from "vitest";
import { planFiling, readMap } from "./filing.ts";
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
    ...overrides,
});

const closed = (number: number, cap: string) =>
    ticket(number, cap, { state: "closed", reason: "completed" });

describe("planFiling", () => {
    it("refuses a block while the decision it needs is still open", () => {
        const filing = planFiling(
            readMap(TEMPLATE, PROJECT),
            [ticket(1, "design-approval")],
            "component-kit",
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
            "article-page",
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
            "article-page",
        );

        expect(filing).toEqual({
            ok: true,
            tickets: [
                {
                    title: "Article page",
                    body: "The page readers land on.\n\n**Acceptance criteria:**\n\n- [ ] It renders a real article.\n\nFiled from the workflow map, block `article-page`.",
                    labels: ["cap:article-page", "app:site", "enhancement"],
                    blockedBy: [2, 3],
                },
            ],
        });
    });

    it("labels an owner block's ticket so it lands under Waiting on you", () => {
        const filing = planFiling(readMap(TEMPLATE, PROJECT), [], "design-approval");

        expect(filing.ok && filing.tickets[0]?.labels).toEqual([
            "cap:design-approval",
            "app:site",
            "owner",
        ]);
    });

    it("drops a need switched off with its group instead of waiting on it forever", () => {
        const map = readMap(TEMPLATE, { ...PROJECT, switches: { blog: false, comments: true } });

        expect(planFiling(map, [], "comments")).toMatchObject({ ok: true });
        expect(planFiling(map, [], "article-page")).toEqual({
            ok: false,
            reason: "`article-page` is switched off",
        });
    });

    it("refuses to file a block twice", () => {
        expect(
            planFiling(
                readMap(TEMPLATE, PROJECT),
                [ticket(5, "design-approval")],
                "design-approval",
            ),
        ).toEqual({
            ok: false,
            reason: "`design-approval` already has #5",
        });
    });
});
