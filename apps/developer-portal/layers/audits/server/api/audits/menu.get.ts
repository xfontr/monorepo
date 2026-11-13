import { defineEventHandler } from "h3";
import type { DocsArtifact } from "#layers/snapshot/shared/types.ts";
import { readArtifact } from "#layers/snapshot/server/utils/store.ts";
import { sortAudits, toAuditReports } from "../../../shared/auditReports.ts";

const LIMIT = 8;

/** The sidebar's submenu: the audits with findings still open, newest first. */
export default defineEventHandler(async () => {
    const docs = await readArtifact<DocsArtifact>("docs");
    const incomplete = toAuditReports(docs?.pages ?? []).filter(({ state }) => state !== "closed");

    return sortAudits(incomplete, "newest")
        .slice(0, LIMIT)
        .map(({ id, title, counts }) => ({
            label: title,
            to: `/audits/${id}`,
            badge: String(counts.open),
        }));
});
