import { describe, expect, it } from "vitest";
import type { DocPage } from "./types.ts";
import { countByStatus, filterDecisions, sortDecisions, toDecisionReports } from "./decisionReports.ts";

function page(path: string, overrides: Partial<DocPage> = {}): DocPage {
    return {
        path,
        kind: "decision",
        title: "🧭 A decision",
        words: 100,
        updatedAt: null,
        decisionStatus: "to-implement",
        decisionOutcome: "accepted",
        decisionSupersededBy: null,
        brokenLinks: [],
        ...overrides,
    };
}

const PAGES: DocPage[] = [
    page("docs/decisions/0001-feature-discoverability.md", { title: "🧭 Making the feature surface discoverable", decisionStatus: "implemented", updatedAt: "2026-01-04T00:00:00Z" }),
    page("docs/decisions/0002-docs-drift-detection.md", { title: "🧭 Catching docs drift", decisionStatus: "wont-implement", updatedAt: "2026-03-02T00:00:00Z" }),
    page("docs/decisions/0003-coverage-report-merge.md", { title: "🧭 Merging the coverage reports", decisionStatus: null, decisionOutcome: null, updatedAt: "2026-02-01T00:00:00Z" }),
    page("docs/decisions/0004-scripts-architecture.md", { title: "🧭 The scripts architecture", decisionOutcome: "superseded", decisionSupersededBy: "0005-later.md", updatedAt: "2026-01-01T00:00:00Z" }),
    page("docs/decisions/README.md", { kind: "doc", title: "🧭 Decisions" }),
    page("docs/guides/first-hour.md", { kind: "doc", title: "🌱 First hour" }),
];

const REPORTS = toDecisionReports(PAGES);

function numbersOf(reports: { number: string }[]): string[] {
    return reports.map((report) => report.number);
}

describe("toDecisionReports", () => {
    it("takes only the numbered reports, so the rubric beside them isn't listed as a decision", () => {
        expect(numbersOf(REPORTS)).toEqual(["0001", "0002", "0003", "0004"]);
    });

    it("derives the route segment from the filename, which is the only id a report has", () => {
        expect(REPORTS[0]?.id).toBe("0001-feature-discoverability");
    });

    it("strips the emoji the house style opens every report with, which says nothing in a column of them", () => {
        expect(REPORTS[0]?.title).toBe("Making the feature surface discoverable");
    });
});

describe("filterDecisions", () => {
    it("narrows to one status, which is the question the section is opened with", () => {
        expect(numbersOf(filterDecisions(REPORTS, { status: "implemented" }))).toEqual(["0001"]);
    });

    it("narrows to superseded reports, the axis a status filter cannot answer", () => {
        expect(numbersOf(filterDecisions(REPORTS, { decision: "superseded" }))).toEqual(["0004"]);
    });

    it("matches the number, so a report cited as 0002 elsewhere is reachable by typing it", () => {
        expect(numbersOf(filterDecisions(REPORTS, { search: "0002" }))).toEqual(["0002"]);
    });

    it("matches the title regardless of case, which is how a half-remembered subject is searched", () => {
        expect(numbersOf(filterDecisions(REPORTS, { search: "DRIFT" }))).toEqual(["0002"]);
    });

    it("keeps everything when nothing is asked of it, rather than an empty list under a blank search", () => {
        expect(filterDecisions(REPORTS, { status: "all", decision: "all", search: "  " })).toHaveLength(4);
    });
});

describe("sortDecisions", () => {
    it("puts the newest decision first by number, not by when the file was last touched", () => {
        expect(numbersOf(sortDecisions(REPORTS, "newest"))).toEqual(["0004", "0003", "0002", "0001"]);
    });

    it("reads in the order the decisions were made when asked for oldest first", () => {
        expect(numbersOf(sortDecisions(REPORTS, "oldest"))).toEqual(["0001", "0002", "0003", "0004"]);
    });

    it("sorts by last commit, so a report edited long after it was filed surfaces", () => {
        expect(numbersOf(sortDecisions(REPORTS, "updated"))).toEqual(["0002", "0003", "0001", "0004"]);
    });

    it("groups by status in the order the vocabulary lists them, unparsed last rather than under a guess", () => {
        expect(numbersOf(sortDecisions(REPORTS, "status"))).toEqual(["0004", "0001", "0002", "0003"]);
    });

    it("leaves the reports it was handed untouched, so a sorted view never reorders the source", () => {
        const before = numbersOf(REPORTS);

        sortDecisions(REPORTS, "oldest");

        expect(numbersOf(REPORTS)).toEqual(before);
    });
});

describe("countByStatus", () => {
    it("shows a zero for a status nothing carries yet, rather than dropping the tile", () => {
        expect(countByStatus([])).toEqual({ "to-implement": 0, "implemented": 0, "wont-implement": 0 });
    });

    it("leaves an unparsed status out of every count instead of filing it under one", () => {
        expect(countByStatus(REPORTS)).toEqual({ "to-implement": 1, "implemented": 1, "wont-implement": 1 });
    });
});
