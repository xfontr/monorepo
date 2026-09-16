import { describe, expect, it } from "vitest";
import { spikeMetaOf } from "./docs.ts";

const frontmatter = (body: string): string => `---\n${body}\n---\n\n# 🧭 A title\n`;

describe("spikeMetaOf", () => {
    it("reads status and decision off a spike report's frontmatter", () => {
        expect(spikeMetaOf("docs/spikes/0001-feature-discoverability.md", frontmatter("spike: 37\nstatus: implemented\ndecision: accepted")))
            .toEqual({ status: "implemented", decision: "accepted", supersededBy: null });
    });

    it("reads supersededBy only when decision is superseded", () => {
        const source = frontmatter("spike: 38\nstatus: to-implement\ndecision: superseded\nsupersededBy: 0150-resolved.md");

        expect(spikeMetaOf("docs/spikes/0038-old.md", source).supersededBy).toBe("0150-resolved.md");
    });

    it("drops supersededBy when decision isn't superseded, even if the frontmatter sets it anyway", () => {
        const source = frontmatter("spike: 37\nstatus: implemented\ndecision: accepted\nsupersededBy: 0150-resolved.md");

        expect(spikeMetaOf("docs/spikes/0001-feature-discoverability.md", source).supersededBy).toBeNull();
    });

    it("answers all-null for anything that isn't a spike report, so a doc that happens to carry frontmatter is never mistaken for one", () => {
        expect(spikeMetaOf("docs/guides/first-hour.md", frontmatter("status: implemented\ndecision: accepted")))
            .toEqual({ status: null, decision: null, supersededBy: null });
    });

    it("answers all-null for the template, which has no frontmatter to parse", () => {
        expect(spikeMetaOf("docs/spikes/TEMPLATE.md", "# 🧭 <Spike title>\n"))
            .toEqual({ status: null, decision: null, supersededBy: null });
    });

    it("answers null status rather than guess at an unrecognised value, so a typo shows as missing instead of wrong", () => {
        const source = frontmatter("spike: 40\nstatus: done\ndecision: accepted");

        expect(spikeMetaOf("docs/spikes/0002-docs-drift-detection.md", source).status).toBeNull();
    });
});
