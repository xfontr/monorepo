import { describe, expect, it } from "vitest";
import assertSegment from "./assertSegment";

describe("assertSegment", () => {
    it.each(["external", "en-GB", "es_ES", "abc123", "A-B_c-9"])(
        "accepts the safe segment %j",
        (segment) => {
            expect(assertSegment(segment)).toBe(true);
        },
    );

    it.each(["../etc", "a/b", "a.b", "en EN", "café", "a:b", "%2F"])(
        "rejects the unsafe segment %j",
        (segment) => {
            expect(assertSegment(segment)).toBe(false);
        },
    );

    it("rejects empty and missing segments", () => {
        expect(assertSegment("")).toBe(false);
        expect(assertSegment(undefined)).toBe(false);
    });
});
