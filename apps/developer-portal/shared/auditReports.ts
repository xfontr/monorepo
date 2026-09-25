import type { AuditFinding, AuditState, FindingStatus } from "./audits.ts";
import type { DocPage } from "./types.ts";
import { AUDIT_STATES, FINDING_STATUSES, auditStateOf } from "./audits.ts";
import { stripLeadingEmoji } from "./wiki.ts";

export interface AuditReport {
    /** The repo path, `docs/audits/2026-09-25-developer-portal.md`. */
    path: string
    /** The filename without its extension — the segment the `/audits/:id` route carries. */
    id: string
    date: string
    title: string
    scope: string | null
    commit: string | null
    findings: AuditFinding[]
    state: AuditState
    /** Seeded from the vocabulary, so a status nothing carries yet still shows its zero. Null statuses count as open. */
    counts: Record<FindingStatus, number>
    updatedAt: string | null
}

function countFindings(findings: AuditFinding[]): Record<FindingStatus, number> {
    const counts = Object.fromEntries(FINDING_STATUSES.map((status) => [status, 0])) as Record<FindingStatus, number>;

    for (const finding of findings) counts[finding.status ?? "open"] += 1;

    return counts;
}

export function toAuditReports(pages: DocPage[]): AuditReport[] {
    return pages
        .filter((page) => page.kind === "audit" && page.audit !== null)
        .map((page) => {
            const id = (page.path.split("/").at(-1) ?? page.path).replace(/\.md$/i, "");
            const findings = page.audit?.findings ?? [];

            return {
                path: page.path,
                id,
                date: id.slice(0, 10),
                title: stripLeadingEmoji(page.title),
                scope: page.audit?.scope ?? null,
                commit: page.audit?.commit ?? null,
                findings,
                state: auditStateOf(findings),
                counts: countFindings(findings),
                updatedAt: page.updatedAt,
            };
        });
}

export interface AuditReportFilter {
    state?: AuditState | "all"
    scope?: string
    search?: string
}

export function filterAudits(reports: AuditReport[], filter: AuditReportFilter): AuditReport[] {
    const needle = filter.search?.trim().toLowerCase() ?? "";

    return reports.filter((report) => {
        if (filter.state && filter.state !== "all" && report.state !== filter.state) return false;
        if (filter.scope && filter.scope !== "all" && report.scope !== filter.scope) return false;
        if (needle.length === 0) return true;

        return `${report.title} ${report.scope ?? ""}`.toLowerCase().includes(needle);
    });
}

export const AUDIT_SORTS = ["newest", "oldest", "most-open"] as const;

export type AuditSort = typeof AUDIT_SORTS[number];

// ISO dates, so a string compare is a chronological one; the id breaks a same-day tie.
function newestFirst(a: AuditReport, b: AuditReport): number {
    return b.id.localeCompare(a.id);
}

export function sortAudits(reports: AuditReport[], sort: AuditSort): AuditReport[] {
    return reports.slice().sort((a, b) => {
        if (sort === "oldest") return a.id.localeCompare(b.id);
        if (sort === "most-open") return b.counts.open - a.counts.open || newestFirst(a, b);

        return newestFirst(a, b);
    });
}

export function scopesOf(reports: AuditReport[]): string[] {
    return [...new Set(reports.map((report) => report.scope).filter((scope): scope is string => scope !== null))].sort();
}

/** Across every audit, so the tiles answer "how much is still owed" rather than "how many files". */
export function countAll(reports: AuditReport[]): { findings: Record<FindingStatus, number>, states: Record<AuditState, number> } {
    const findings = countFindings(reports.flatMap((report) => report.findings));
    const states = Object.fromEntries(AUDIT_STATES.map((state) => [state, 0])) as Record<AuditState, number>;

    for (const report of reports) states[report.state] += 1;

    return { findings, states };
}
