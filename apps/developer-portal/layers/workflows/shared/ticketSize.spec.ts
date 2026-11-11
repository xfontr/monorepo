import { describe, expect, it } from "vitest";
import { readTemplate } from "./template.ts";
import { bundlesOf, blocksOn, ticketsToFile } from "./ticketSize.ts";

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

describe("bundlesOf", () => {
    it("splits a stage where an owner block inside it sits between its build blocks", () => {
        expect(ids(bundlesOf(blocksOn(template), "stage"))).toEqual([
            ["audit"],
            ["hosting"],
            ["tokens", "lab"],
            ["approval"],
            ["inventory"],
            ["article", "home"],
        ]);
    });

    it("puts every spike in one ticket only when the size is lean", () => {
        expect(ids(bundlesOf(blocksOn(template), "lean"))[0]).toEqual(["audit", "hosting"]);
    });
});

describe("ticketsToFile", () => {
    it("counts a block filed alone as its suggested tickets, and a bundle as one", () => {
        expect(ticketsToFile(blocksOn(template))).toEqual({ block: 9, stage: 6, lean: 5 });
    });

    it("leaves out an optional block that is off by default", () => {
        expect(blocksOn(template).map(({ id }) => id)).not.toContain("search");
    });
});
