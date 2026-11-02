import { describe, expect, it } from "vitest";
import { coverHeight } from "./coverHeight";

describe("coverHeight", () => {
    it("crops a square upload to its 16:10 box, so the CDN sends no pixels the frame hides", () => {
        expect(coverHeight(1280, 16 / 10)).toBe(800);
    });

    it("rounds to a whole pixel, so the srcset never asks the CDN for a fractional h", () => {
        expect(coverHeight(603, 3 / 2)).toBe(402);
    });

    it("returns nothing for an upload of unknown width, leaving its height to the source", () => {
        expect(coverHeight(undefined, 16 / 9)).toBeUndefined();
    });
});
