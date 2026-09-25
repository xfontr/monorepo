import { describe, expect, it } from "vitest";
import type { AuditFinding } from "./audits.ts";
import type { DocPage } from "./types.ts";
import { countAll, filterAudits, scopesOf, sortAudits, toAuditReports } from "./auditReports.ts";

function row(id: string, status: AuditFinding["status"]): AuditFinding {
    return { id, category: "Bugs", status, ref: null };
}

function page(path: string, scope: string | null, findings: AuditFinding[], overrides: Partial<DocPage> = {}): DocPage {
    return {
        path,
        kind: "audit",
        title: "🔎 An audit",
        words: 100,
        updatedAt: null,
        decisionStatus: null,
        decisionOutcome: null,
        decisionSupersededBy: null,
        audit: { scope, commit: "61b6f7f", findings },
        brokenLinks: [],
        ...overrides,
    };
}

const PAGES: DocPage[] = [
    page("docs/audits/2026-09-20-scripts.md", "@monorepo/scripts", [row("B1", "fixed"), row("B2", "wont-fix")]),
    page("docs/audits/2026-09-25-developer-portal.md", "@monorepo/developer-portal", [row("B1", "open"), row("B2", "fixed"), row("B3", null)]),
    page("docs/audits/2026-09-22-ui.md", "@monorepo/ui", [row("B1", "open")], { title: "🔎 The UI kit" }),
    page("docs/audits/README.md", null, [], { kind: "doc", audit: null }),
];

const REPORTS = toAuditReports(PAGES);

function idsOf(reports: { id: string }[]): string[] {
    return reports.map((report) => report.id);
}

describe("toAuditReports", () => {
    it("takes only dated audits, so the rubric beside them isn't listed as one", () => {
        expect(REPORTS).toHaveLength(3);
    });

    it("derives the date from the filename and strips the heading's emoji", () => {
        expect(REPORTS[2]).toMatchObject({ date: "2026-09-22", title: "The UI kit" });
    });

    it("counts an unparsed status as open, so a typo can't make an audit look further along", () => {
        expect(REPORTS[1]?.counts).toEqual({ "open": 2, "fixed": 1, "wont-fix": 0 });
        expect(REPORTS[1]?.state).toBe("in-progress");
    });

    it("closes an audit whose findings are all fixed or deliberately declined", () => {
        expect(REPORTS[0]?.state).toBe("closed");
    });
});

describe("filterAudits and sortAudits", () => {
    it("filters on state and scope together", () => {
        expect(idsOf(filterAudits(REPORTS, { state: "open", scope: "@monorepo/ui" }))).toEqual(["2026-09-22-ui"]);
        expect(filterAudits(REPORTS, { state: "closed", scope: "@monorepo/ui" })).toEqual([]);
    });

    it("searches the scope as well as the title", () => {
        expect(idsOf(filterAudits(REPORTS, { search: "PORTAL" }))).toEqual(["2026-09-25-developer-portal"]);
    });

    it("sorts newest first by the dated filename, not by list order", () => {
        expect(idsOf(sortAudits(REPORTS, "newest"))).toEqual(["2026-09-25-developer-portal", "2026-09-22-ui", "2026-09-20-scripts"]);
    });

    it("puts the audit with the most open findings first, breaking ties by date", () => {
        expect(idsOf(sortAudits(REPORTS, "most-open"))).toEqual(["2026-09-25-developer-portal", "2026-09-22-ui", "2026-09-20-scripts"]);
    });
});

describe("countAll and scopesOf", () => {
    it("totals findings across every audit and seeds every state with zero", () => {
        expect(countAll(REPORTS)).toEqual({
            findings: { "open": 3, "fixed": 2, "wont-fix": 1 },
            states: { "open": 1, "in-progress": 1, "closed": 1 },
        });
    });

    it("lists each scope once, sorted, for the filter", () => {
        expect(scopesOf(REPORTS)).toEqual(["@monorepo/developer-portal", "@monorepo/scripts", "@monorepo/ui"]);
    });
});
