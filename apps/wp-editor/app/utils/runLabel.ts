import type { RunReport } from "#shared/types.ts";

export const runLabel = ({ kind, incomplete }: Pick<RunReport, "kind" | "incomplete">): string =>
    `${kind === "apply" ? "Bulk apply" : "Dry run"}${incomplete ? " (incomplete)" : ""}`;
