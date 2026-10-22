import { describe, expect, it } from "vitest";
import { externalCheck, group, headline, jobOf, stripLogPrefix, type Check } from "./checks.ts";

const check = (overrides: Partial<Check>): Check => ({
    name: "checks",
    bucket: "pass",
    state: "SUCCESS",
    link: "",
    workflow: "",
    description: "",
    ...overrides,
});

// Shapes from `gh pr checks 287 --json …`: one Actions job and one SonarCloud check run.
const ACTIONS_JOB = check({
    bucket: "fail",
    state: "FAILURE",
    workflow: "CI",
    link: "https://github.com/owner/repo/actions/runs/39791178931/job/119867300686",
});
const SONAR = check({
    name: "SonarCloud",
    link: "https://github.com/owner/repo/runs/119867629091",
});

describe("group", () => {
    it("counts a skipped check as passed and a cancelled one as failed", () => {
        const grouped = group([
            ACTIONS_JOB,
            check({ bucket: "cancel", state: "CANCELLED" }),
            check({ bucket: "skipping", state: "SKIPPED" }),
            check({ bucket: "pending", state: "IN_PROGRESS" }),
            SONAR,
        ]);

        expect(grouped.failed).toHaveLength(2);
        expect(grouped.pending).toHaveLength(1);
        expect(grouped.passed).toBe(2);
        expect(headline("#287 Title", grouped)).toBe(
            "#287 Title: 2 failed, 1 pending, 2 passed or skipped",
        );
    });
});

describe("jobOf", () => {
    it("reads the run and job ids off an Actions link", () => {
        expect(jobOf(ACTIONS_JOB)).toEqual({ run: "39791178931", job: "119867300686" });
    });

    it("finds no job in a check run from an external app, which has no log to fetch", () => {
        expect(jobOf(SONAR)).toBeUndefined();
    });
});

describe("stripLogPrefix", () => {
    it("removes the job, step and timestamp, including on lines that carry no timestamp", () => {
        const log = [
            "checks\tRun nx affected\t﻿2026-10-22T13:55:45.1716647Z ##[group]Run nx affected",
            "checks\tRun nx affected\t2026-10-22T13:59:41.0779442Z ##[error]Error: Hook timed out in 10000ms.",
            "checks\tRun nx affected\t ❯ useArticleListing.spec.ts:79:1",
        ].join("\n");

        expect(stripLogPrefix(log).split("\n")).toEqual([
            "##[error]Error: Hook timed out in 10000ms.",
            " ❯ useArticleListing.spec.ts:79:1",
        ]);
    });
});

describe("externalCheck", () => {
    it("prints the description and link, the only detail an app's check run offers", () => {
        expect(
            externalCheck({ ...SONAR, state: "FAILURE", description: "Quality Gate failed" }),
        ).toEqual([
            "✖ SonarCloud (failure)",
            "  Quality Gate failed",
            "  https://github.com/owner/repo/runs/119867629091",
        ]);
    });
});
