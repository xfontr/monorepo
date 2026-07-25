import { describe, expect, it } from "vitest";
import selectNamespaces from "./selectNamespaces";

const ALL = {
    shared: { health: "Health" },
    meta: { title: "Budget Forecast" },
    user: { instructions: { title: "Instructions" } },
};

describe("selectNamespaces", () => {
    it("returns the full tree when no namespaces are given", () => {
        expect(selectNamespaces(ALL)).toBe(ALL);
        expect(selectNamespaces(ALL, [])).toBe(ALL);
    });

    it("keeps only the requested namespaces, preserving their values", () => {
        expect(selectNamespaces(ALL, ["shared", "meta"])).toEqual({
            shared: { health: "Health" },
            meta: { title: "Budget Forecast" },
        });
    });

    it("silently ignores namespaces that do not exist", () => {
        expect(selectNamespaces(ALL, ["shared", "nope"])).toEqual({
            shared: { health: "Health" },
        });
    });

    it("does not leak inherited Object properties", () => {
        expect(selectNamespaces(ALL, ["constructor", "toString"])).toEqual({});
    });
});
