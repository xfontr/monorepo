import type { DocPage, SpikeDecision, SpikeStatus } from "./types.ts";
import { SPIKE_STATUSES } from "./spikes.ts";
import { stripLeadingEmoji } from "./wiki.ts";

export interface SpikeReport {
    /** The repo path, `docs/spikes/0009-comment-discipline.md`. */
    path: string
    /** The filename without its extension — the segment the `/spikes/:id` route carries. */
    id: string
    number: string
    title: string
    status: SpikeStatus | null
    decision: SpikeDecision | null
    supersededBy: string | null
    updatedAt: string | null
    words: number
}

/** Everything the collector already parsed off a report's frontmatter, as one row per file. */
export function toSpikeReports(pages: DocPage[]): SpikeReport[] {
    return pages
        .filter((page) => page.kind === "spike")
        .map((page) => {
            const id = (page.path.split("/").at(-1) ?? page.path).replace(/\.md$/i, "");

            return {
                path: page.path,
                id,
                number: id.slice(0, 4),
                title: stripLeadingEmoji(page.title),
                status: page.spikeStatus,
                decision: page.spikeDecision,
                supersededBy: page.spikeSupersededBy,
                updatedAt: page.updatedAt,
                words: page.words,
            };
        });
}

export interface SpikeFilter {
    status?: SpikeStatus | "all"
    decision?: SpikeDecision | "all"
    search?: string
}

export function filterSpikes(reports: SpikeReport[], filter: SpikeFilter): SpikeReport[] {
    const needle = filter.search?.trim().toLowerCase() ?? "";

    return reports.filter((report) => {
        if (filter.status && filter.status !== "all" && report.status !== filter.status) return false;
        if (filter.decision && filter.decision !== "all" && report.decision !== filter.decision) return false;
        if (needle.length === 0) return true;

        return `${report.number} ${report.title}`.toLowerCase().includes(needle);
    });
}

export const SPIKE_SORTS = ["newest", "oldest", "updated", "status"] as const;

export type SpikeSort = typeof SPIKE_SORTS[number];

/** A report whose `status` didn't parse sorts last rather than under a guessed value. */
function statusRank(status: SpikeStatus | null): number {
    return status === null ? SPIKE_STATUSES.length : SPIKE_STATUSES.indexOf(status);
}

// The number is zero-padded to four digits by the naming rule in `docs/spikes/README.md`, so
// comparing it as a string is comparing it as a number.
function byNumberDescending(a: SpikeReport, b: SpikeReport): number {
    return b.number.localeCompare(a.number);
}

export function sortSpikes(reports: SpikeReport[], sort: SpikeSort): SpikeReport[] {
    return reports.slice().sort((a, b) => {
        if (sort === "oldest") return a.number.localeCompare(b.number);
        if (sort === "updated") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || byNumberDescending(a, b);
        if (sort === "status") return statusRank(a.status) - statusRank(b.status) || byNumberDescending(a, b);

        return byNumberDescending(a, b);
    });
}

/** Seeded from the vocabulary rather than from the reports, so a status nothing carries yet still shows its zero. */
export function countByStatus(reports: SpikeReport[]): Record<SpikeStatus, number> {
    const counts = Object.fromEntries(SPIKE_STATUSES.map((status) => [status, 0])) as Record<SpikeStatus, number>;

    for (const report of reports) {
        if (report.status !== null) counts[report.status] += 1;
    }

    return counts;
}
