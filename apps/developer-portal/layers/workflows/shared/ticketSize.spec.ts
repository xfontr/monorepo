import { describe, expect, it } from "vitest";
import { readTemplate } from "./template.ts";
import { bundlesOf, blocksOn, templateEstimate, ticketsToFile } from "./ticketSize.ts";

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
        ["scaffold", "deploy"],
    ],
    fast: [
        ["audit", "hosting"],
        ["signoff"],
        ["tokens", "lab"],
        ["approval"],
        ["inventory"],
        ["scaffold", "deploy"],
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

describe("blocksOn", () => {
    it("leaves out an optional block that is off by default", () => {
        expect(blocksOn(template).map(({ id }) => id)).not.toContain("search");
    });
});

describe("templateEstimate", () => {
    it("prices the staged map's defaults in blocks, tickets at each size and points", () => {
        expect(templateEstimate(staged)).toEqual({
            blocks: 9,
            tickets: { block: 9, supervised: 7, fast: 6 },
            points: 5,
        });
    });
});
