import { describe, expect, it } from "vitest";
import { readProject } from "./project.ts";

const PROJECT = {
    id: "site",
    title: "Site",
    template: "website-rebuild",
    milestone: "Site",
};

describe("readProject", () => {
    it("points a leftover gates: block at the owner block that replaced it", () => {
        expect(readProject({ ...PROJECT, gates: { discovery: "2026-09-30" } }).problems).toEqual([
            "`gates:` is gone: a gate is an `owner` block now, approved by closing its ticket or settling it as done",
        ]);
    });
});
