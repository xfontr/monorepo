import { describe, expect, it } from "vitest";
import { readMap } from "./filing.ts";
import { setupPlan } from "./setup.ts";

const TEMPLATE = {
    capabilities: [
        { id: "scope-signoff", kind: "owner" },
        { id: "hosting", kind: "spike" },
        { id: "scaffold" },
        { id: "comments", optional: true, default: false },
    ],
};

const PROJECT = {
    milestone: "Harbour",
    area: "app:harbour",
    settled: { scaffold: { status: "done" } },
};

describe("setupPlan", () => {
    it("asks for every label filing will use, so the first `file` never fails on a missing one", () => {
        expect(setupPlan(readMap(TEMPLATE, PROJECT), { milestone: false, labels: [] })).toEqual({
            milestone: "Harbour",
            labels: ["app:harbour", "owner", "spike", "cap:scope-signoff", "cap:hosting"],
        });
    });

    it("leaves out what GitHub already has, so a second run creates nothing", () => {
        const map = readMap(TEMPLATE, { ...PROJECT, switches: { comments: true } });

        expect(
            setupPlan(map, {
                milestone: true,
                labels: ["app:harbour", "owner", "spike", "cap:scope-signoff", "cap:hosting"],
            }),
        ).toEqual({ milestone: null, labels: ["enhancement", "cap:comments"] });
    });
});
