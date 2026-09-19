import type { DecisionOutcome, DecisionStatus, DocPage } from "./types.ts";
import { DECISION_STATUSES } from "./decisions.ts";
import { stripLeadingEmoji } from "./wiki.ts";

export interface DecisionReport {
    /** The repo path, `docs/decisions/0009-comment-discipline.md`. */
    path: string
    /** The filename without its extension — the segment the `/decisions/:id` route carries. */
    id: string
    number: string
    title: string
    status: DecisionStatus | null
    decision: DecisionOutcome | null
    supersededBy: string | null
    updatedAt: string | null
    words: number
}

/** Everything the collector already parsed off a report's frontmatter, as one row per file. */
export function toDecisionReports(pages: DocPage[]): DecisionReport[] {
    return pages
        .filter((page) => page.kind === "decision")
        .map((page) => {
            const id = (page.path.split("/").at(-1) ?? page.path).replace(/\.md$/i, "");

            return {
                path: page.path,
                id,
                number: id.slice(0, 4),
                title: stripLeadingEmoji(page.title),
                status: page.decisionStatus,
                decision: page.decisionOutcome,
                supersededBy: page.decisionSupersededBy,
                updatedAt: page.updatedAt,
                words: page.words,
            };
        });
}

export interface DecisionReportFilter {
    status?: DecisionStatus | "all"
    decision?: DecisionOutcome | "all"
    search?: string
}

export function filterDecisions(reports: DecisionReport[], filter: DecisionReportFilter): DecisionReport[] {
    const needle = filter.search?.trim().toLowerCase() ?? "";

    return reports.filter((report) => {
        if (filter.status && filter.status !== "all" && report.status !== filter.status) return false;
        if (filter.decision && filter.decision !== "all" && report.decision !== filter.decision) return false;
        if (needle.length === 0) return true;

        return `${report.number} ${report.title}`.toLowerCase().includes(needle);
    });
}

export const DECISION_SORTS = ["newest", "oldest", "updated", "status"] as const;

export type DecisionSort = typeof DECISION_SORTS[number];

/** A report whose `status` didn't parse sorts last rather than under a guessed value. */
function statusRank(status: DecisionStatus | null): number {
    return status === null ? DECISION_STATUSES.length : DECISION_STATUSES.indexOf(status);
}

// The number is zero-padded to four digits by the naming rule in `docs/decisions/README.md`, so
// comparing it as a string is comparing it as a number.
function byNumberDescending(a: DecisionReport, b: DecisionReport): number {
    return b.number.localeCompare(a.number);
}

export function sortDecisions(reports: DecisionReport[], sort: DecisionSort): DecisionReport[] {
    return reports.slice().sort((a, b) => {
        if (sort === "oldest") return a.number.localeCompare(b.number);
        if (sort === "updated") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || byNumberDescending(a, b);
        if (sort === "status") return statusRank(a.status) - statusRank(b.status) || byNumberDescending(a, b);

        return byNumberDescending(a, b);
    });
}

/** Seeded from the vocabulary rather than from the reports, so a status nothing carries yet still shows its zero. */
export function countByStatus(reports: DecisionReport[]): Record<DecisionStatus, number> {
    const counts = Object.fromEntries(DECISION_STATUSES.map((status) => [status, 0])) as Record<DecisionStatus, number>;

    for (const report of reports) {
        if (report.status !== null) counts[report.status] += 1;
    }

    return counts;
}
