import { describe, expect, it } from "vitest";
import { typedExtra } from "./project.ts";
import { readTemplate } from "./template.ts";
import {
    bundlesOf,
    blocksOn,
    estimateOf,
    pageCosts,
    receiptOf,
    templateEstimate,
    ticketsToFile,
} from "./ticketSize.ts";

const { template } = readTemplate({
    id: "site",
    title: "Site",
    stages: [
        { id: "discovery", title: "Discovery" },
        { id: "design", title: "Design" },
        { id: "build", title: "Build" },
    ],
    capabilities: [
        { id: "audit", stage: "discovery", title: "Audit", kind: "spike" },
        { id: "hosting", stage: "discovery", title: "Hosting", kind: "spike" },
        { id: "tokens", stage: "design", title: "Tokens" },
        { id: "lab", stage: "design", title: "Lab", dependsOn: ["tokens"] },
        { id: "approval", stage: "design", title: "Approval", kind: "owner", dependsOn: ["lab"] },
        { id: "inventory", stage: "design", title: "Inventory", dependsOn: ["approval"] },
        {
            id: "article",
            stage: "build",
            title: "Article",
            tickets: [
                { title: "Article body", criteria: [] },
                { title: "Article footnotes", criteria: [] },
            ],
        },
        { id: "home", stage: "build", title: "Home", dependsOn: ["article"] },
        { id: "search", stage: "build", title: "Search", optional: true, default: false },
    ],
});

const ids = (bundles: { id: string }[][]) => bundles.map((bundle) => bundle.map(({ id }) => id));

/** The scripts' `STAGED` map from `domain/filing.spec.ts`; both copies of `bundlesOf` must agree on it. */
const { template: staged } = readTemplate({
    id: "staged",
    title: "Staged",
    stages: [
        { id: "discovery", title: "Discovery" },
        { id: "design", title: "Design" },
        { id: "foundations", title: "Foundations" },
    ],
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
        { id: "scaffold", stage: "foundations", title: "Scaffold", complexity: 2 },
        {
            id: "deploy",
            stage: "foundations",
            title: "Deploy",
            dependsOn: ["scaffold", "signoff", "tokens"],
            complexity: 3,
        },
    ],
});

/** Identical to `STAGED_BUNDLES` in the scripts' `domain/filing.spec.ts`. */
const STAGED_BUNDLES = {
    block: [
        ["audit"],
        ["hosting"],
        ["signoff"],
        ["tokens"],
        ["lab"],
        ["approval"],
        ["inventory"],
        ["scaffold"],
        ["deploy"],
    ],
    supervised: [
        ["audit"],
        ["hosting"],
        ["signoff"],
        ["tokens", "lab"],
        ["approval"],
        ["inventory"],
        ["scaffold"],
        ["deploy"],
    ],
    fast: [
        ["audit", "hosting"],
        ["signoff"],
        ["tokens", "lab"],
        ["approval"],
        ["inventory"],
        ["scaffold"],
        ["deploy"],
    ],
};

describe("bundlesOf", () => {
    it.each(["block", "supervised", "fast"] as const)(
        "groups the staged map into the %s bundles workflow:file files",
        (size) => {
            expect(ids(bundlesOf(blocksOn(staged), size))).toEqual(STAGED_BUNDLES[size]);
        },
    );

    it("wraps onto a new ticket at the size's width, each block after the ones it needs", () => {
        const { template: heavy } = readTemplate({
            id: "heavy",
            title: "Heavy",
            stages: [{ id: "build", title: "Build" }],
            capabilities: [
                { id: "kit", stage: "build", title: "Kit", complexity: 8 },
                { id: "home", stage: "build", title: "Home", complexity: 8, dependsOn: ["post"] },
                { id: "post", stage: "build", title: "Post", complexity: 5 },
            ],
        });

        expect(ids(bundlesOf(blocksOn(heavy), "supervised"))).toEqual([["kit", "post"], ["home"]]);
        expect(ids(bundlesOf(blocksOn(heavy), "fast"))).toEqual([["kit", "post", "home"]]);
    });

    it("keeps a block with suggested tickets beside its stage's other build blocks", () => {
        expect(ids(bundlesOf(blocksOn(template), "supervised")).at(-1)).toEqual([
            "article",
            "home",
        ]);
    });
});

describe("ticketsToFile", () => {
    it("counts a block filed alone as its suggested tickets, and a bundle as one", () => {
        expect(ticketsToFile(blocksOn(template))).toEqual({ block: 9, supervised: 6, fast: 5 });
    });
});

describe("ticketsToFile after filing", () => {
    it("counts a bundle with filed members as one ticket for the rest, not as new bundles", () => {
        const filed = new Set(["audit", "tokens"]);

        expect(ticketsToFile(blocksOn(staged), undefined, filed)).toEqual({
            block: 7,
            supervised: 7,
            fast: 7,
        });
    });
});

describe("blocksOn", () => {
    it("leaves out an optional block that is off by default", () => {
        expect(blocksOn(template).map(({ id }) => id)).not.toContain("search");
    });
});

describe("estimateOf", () => {
    it("counts a project's pages as blocks with their type's points", () => {
        const page = {
            ...template.capabilities.find(({ id }) => id === "home")!,
            id: "services-page",
            title: "Services",
            complexity: 5,
        };
        const without = estimateOf(template);

        expect(estimateOf(template, {}, [page])).toMatchObject({
            blocks: without.blocks + 1,
            points: without.points + 5,
        });
    });
});

describe("receiptOf", () => {
    const { template: priced } = readTemplate({
        id: "priced",
        title: "Priced",
        stages: [{ id: "build", title: "Build" }],
        groups: [{ id: "blog", title: "Blog", optional: true, default: true }],
        types: [{ id: "custom-page", stage: "build", title: "Custom page", complexity: 5 }],
        capabilities: [
            { id: "kit", stage: "build", title: "Kit", complexity: 8 },
            { id: "post", stage: "build", group: "blog", title: "Post", complexity: 5 },
            {
                id: "comments",
                stage: "build",
                group: "blog",
                title: "Comments",
                complexity: 3,
                optional: true,
                default: true,
            },
            { id: "search", stage: "build", title: "Search", complexity: 2, optional: true },
        ],
    });
    const pages = [{ id: "services-page", type: "custom-page", title: "Services" }];

    it("lists the core, each feature on with what sits inside it, and each page", () => {
        expect(
            receiptOf(priced, {}, pages).map(({ label, detail, points, nested }) => [
                label,
                detail,
                points,
                nested,
            ]),
        ).toEqual([
            ["Core build", null, 8, false],
            ["Blog", null, 5, false],
            ["Comments", null, 3, true],
            ["Services", "Custom page", 5, false],
        ]);
    });

    it("adds up to the estimate's points, so the receipt never disagrees with the total", () => {
        const sum = (switches: Record<string, boolean>) =>
            receiptOf(priced, switches).reduce((total, { points }) => total + points, 0);

        expect(sum({})).toBe(estimateOf(priced).points);
        expect(sum({ blog: false, search: true })).toBe(
            estimateOf(priced, { blog: false, search: true }).points,
        );
    });
});

describe("receiptOf setups", () => {
    const { template: blogs } = readTemplate({
        id: "blogs",
        title: "Blogs",
        stages: [{ id: "build", title: "Build" }],
        capabilities: [
            {
                id: "comments",
                stage: "build",
                title: "Comments setup",
                complexity: 8,
                onDemand: true,
            },
        ],
        types: [
            {
                id: "blog-comments",
                stage: "build",
                title: "Blog + comments",
                complexity: 13,
                dependsOn: ["comments"],
            },
        ],
    });
    const pages = [
        { id: "news-page", type: "blog-comments", title: "News" },
        { id: "notes-page", type: "blog-comments", title: "Notes" },
    ];

    it("charges the setup to the first page that needs it and nothing to the next", () => {
        expect(pageCosts(blogs, pages).map(({ points }) => points)).toEqual([21, 13]);
        expect(pageCosts(blogs, pages.slice(1)).map(({ points }) => points)).toEqual([21]);
    });

    it("adds up to the estimate's points, setup counted once", () => {
        const rows = receiptOf(blogs, {}, pages);
        const extras = pages.map((page) => typedExtra(blogs.types[0]!, page));

        expect(rows.map(({ detail, points }) => [detail, points])).toEqual([
            [null, 0],
            ["Blog + comments, with Comments setup", 21],
            ["Blog + comments", 13],
        ]);
        expect(estimateOf(blogs, {}, extras).points).toBe(34);
    });
});

describe("templateEstimate", () => {
    it("prices the staged map's defaults in blocks, tickets at each size and points", () => {
        expect(templateEstimate(staged)).toEqual({
            blocks: 9,
            tickets: { block: 9, supervised: 8, fast: 7 },
            points: 5,
        });
    });
});
