import { describe, expect, it } from "vitest";
import { projectActivity } from "./workflowActivity.ts";
import { projectView, readProject, readTemplate, type SnapshotIssue } from "./workflows.ts";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [
        { id: "build", title: "Build" },
        { id: "launch", title: "Launch" },
    ],
    capabilities: [
        { id: "search", stage: "build", title: "Search" },
        { id: "seo", stage: "build", title: "SEO" },
        { id: "cutover", stage: "launch", title: "Cutover" },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });

const issue = (
    number: number,
    caps: string[],
    activity: string[],
    state: SnapshotIssue["state"] = "closed",
): SnapshotIssue => ({
    number,
    title: `#${number}`,
    url: "",
    state,
    reason: state === "closed" ? "completed" : null,
    caps,
    createdAt: null,
    closedAt: null,
    activity,
    blockedBy: [],
    branch: false,
    owner: false,
    complexity: null,
});

const activityOf = (issues: SnapshotIssue[]) =>
    projectActivity(
        projectView(project, template, { syncedAt: "", milestone: "P", issues, noMilestone: [] }),
    );

describe("projectActivity", () => {
    it("has nothing to draw when no commit names any ticket", () => {
        expect(activityOf([issue(1, ["search"], [])])).toBeNull();
    });

    // 2026-10-05 is a Monday and 2026-10-11 the Sunday after it.
    it("counts active days, not commits, in Monday-to-Sunday weeks", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-10-05", "2026-10-05", "2026-10-11", "2026-10-12"]),
        ]);

        expect(activity?.weeks).toEqual(["2026-10-05", "2026-10-12"]);
        expect(activity?.capabilities.search?.weeks).toEqual([2, 1]);
        expect(activity?.capabilities.search).toMatchObject({ commits: 4, days: 3, tickets: 1 });
    });

    it("lays every capability on one timeline, so a quiet one reads as smaller than a busy one", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-10-05"]),
            issue(2, ["cutover"], ["2026-10-26"]),
        ]);

        expect(activity?.capabilities.search?.weeks).toEqual([1, 0, 0, 0]);
        expect(activity?.capabilities.cutover?.weeks).toEqual([0, 0, 0, 1]);
        expect(activity?.capabilities.seo?.weeks).toEqual([0, 0, 0, 0]);
    });

    it("counts the capabilities each stage moved per day, in stage order, for the strip", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-10-05", "2026-10-06"]),
            issue(2, ["seo"], ["2026-10-06"]),
            issue(3, ["cutover"], ["2026-10-08"]),
        ]);

        expect(activity?.days).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]);
        expect(activity?.byStage).toEqual([
            [1, 0],
            [2, 0],
            [0, 0],
            [0, 1],
        ]);
    });

    it("tops every sparkline at the busiest week any capability had, so they compare", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-10-05", "2026-10-06", "2026-10-07"]),
            issue(2, ["seo"], ["2026-10-05"]),
        ]);

        expect(activity?.peak).toBe(3);
    });

    it("flags an open capability left three weeks behind the project's latest commit", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-10-01"], "open"),
            issue(2, ["search"], ["2026-10-02"]),
            issue(3, ["seo"], ["2026-10-02"], "open"),
            issue(4, ["seo"], ["2026-10-01"]),
            issue(5, ["cutover"], ["2026-10-23"]),
        ]);

        expect(activity?.capabilities.search?.quietSince).toBe("2026-10-02");
        expect(activity?.capabilities.cutover?.quietSince).toBeNull();
    });

    it("never calls an open capability quiet when it moved within the last three weeks", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-10-03"], "open"),
            issue(2, ["search"], ["2026-10-03"]),
            issue(3, ["cutover"], ["2026-10-23"]),
        ]);

        expect(activity?.capabilities.search?.quietSince).toBeNull();
    });

    it("never calls a delivered capability quiet, however long ago it finished", () => {
        const activity = activityOf([
            issue(1, ["search"], ["2026-09-01"]),
            issue(2, ["cutover"], ["2026-10-23"]),
        ]);

        expect(activity?.capabilities.search?.quietSince).toBeNull();
    });
});
