import { describe, expect, it } from "vitest";
import { readTemplate } from "./template.ts";

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

    it("rejects a complexity off the Fibonacci scale, which would make totals incomparable", () => {
        const { template, problems } = readTemplate({
            ...TEMPLATE,
            capabilities: [{ id: "x", stage: "build", title: "X", complexity: 4 }],
        });

        expect(problems).toEqual([
            "capability `x`: `complexity: 4` isn't one of 1, 2, 3, 5, 8, 13, 21",
        ]);
        expect(template.capabilities[0]?.complexity).toBeNull();
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
});

describe("groups", () => {
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
