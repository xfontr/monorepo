import type { RunReport } from "#shared/types.ts";

/** How each kind of bulk run names itself, what it did to an article, and what a rerun retries. */
export const RUN_LABELS = {
    apply: { name: "Bulk apply", ok: "Applied", doing: "Writing", retried: "pending" },
    "dry-run": { name: "Dry run", ok: "Would apply", doing: "Checking", retried: "pending" },
    restore: { name: "Bulk restore", ok: "Restored", doing: "Restoring", retried: "applied" },
} as const satisfies Record<
    RunReport["kind"],
    { name: string; ok: string; doing: string; retried: string }
>;

export const runLabel = ({ kind, incomplete }: Pick<RunReport, "kind" | "incomplete">): string =>
    `${RUN_LABELS[kind].name}${incomplete ? " (incomplete)" : ""}`;
