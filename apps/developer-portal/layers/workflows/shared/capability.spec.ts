import { describe, expect, it } from "vitest";
import { dependencyCycle } from "./capability.ts";
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
