import { describe, expect, it } from "vitest";
import { spikeStatusOf } from "./docs.ts";

describe("spikeStatusOf", () => {
    it("reads the Status line off a spike report", () => {
        expect(spikeStatusOf("docs/spikes/0037-feature-discoverability.md", "Spike: #37\nStatus: Implemented\n"))
            .toBe("implemented");
    });

    it("matches the value case-insensitively, so house style doesn't decide whether it parses", () => {
        expect(spikeStatusOf("docs/spikes/0038-parallel-dev-envs.md", "Status: to implement\n")).toBe("to-implement");
    });

    it("answers null for anything that isn't a spike report, so a stray 'Status:' line elsewhere is never mistaken for one", () => {
        expect(spikeStatusOf("docs/guides/first-hour.md", "Status: Implemented\n")).toBeNull();
    });

    it("answers null for the template, which has no Status line to parse", () => {
        expect(spikeStatusOf("docs/spikes/TEMPLATE.md", "# 🧭 <Spike title>\n\nSpike: #<issue number>\n")).toBeNull();
    });

    it("answers null rather than guess at an unrecognised value, so a typo shows as missing instead of wrong", () => {
        expect(spikeStatusOf("docs/spikes/0040-docs-drift-detection.md", "Status: Done\n")).toBeNull();
    });
});
