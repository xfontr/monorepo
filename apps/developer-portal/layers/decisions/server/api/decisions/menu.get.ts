import { defineEventHandler } from "h3";
import type { DocsArtifact } from "#layers/snapshot/shared/types.ts";
import { readArtifact } from "#layers/snapshot/server/utils/store.ts";
import { sortDecisions, toDecisionReports } from "../../../shared/decisionReports.ts";

const LIMIT = 8;

/** The sidebar's submenu: the decisions still to implement, newest first. */
export default defineEventHandler(async () => {
    const docs = await readArtifact<DocsArtifact>("docs");
    const owed = toDecisionReports(docs?.pages ?? []).filter(
        ({ status }) => status === "to-implement",
    );

    return sortDecisions(owed, "newest")
        .slice(0, LIMIT)
        .map(({ id, number, title }) => ({ label: `${number} ${title}`, to: `/decisions/${id}` }));
});
