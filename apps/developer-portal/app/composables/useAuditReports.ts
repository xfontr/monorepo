import { toAuditReports } from "#shared/auditReports.ts";

/** Read off the collected snapshot rather than the content collection, because the findings tables are parsed there. */
export function useAuditReports() {
    const { data: snapshot } = useSnapshot("docs");

    return computed(() => toAuditReports(snapshot.value?.docs?.pages ?? []));
}
