import { describe, expect, it } from "vitest";
import { blockMarkers, markersDiffer } from "./blockMarkers.ts";

const BASE = `<!-- wp:heading {"level":2} --><h2 class="x">A</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>b</p><!-- /wp:paragraph --><!-- wp:separator /-->`;

describe("block marker guard", () => {
    it("ignores attribute and text edits inside unchanged blocks", () => {
        const edited = BASE.replace('{"level":2}', '{"level":3}').replace("<p>b</p>", "<p>c</p>");

        expect(markersDiffer(BASE, edited)).toBe(false);
    });

    it("flags a dropped block", () => {
        expect(markersDiffer(BASE, BASE.replace("<!-- wp:separator /-->", ""))).toBe(true);
    });

    it("keeps self-closing markers distinct from openers", () => {
        expect(blockMarkers(BASE)).toEqual([
            "heading",
            "/heading",
            "paragraph",
            "/paragraph",
            "separator/",
        ]);
    });
});
