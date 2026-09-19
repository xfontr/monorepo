import { toDecisionReports } from "#shared/decisionReports.ts";

/** Read off the collected snapshot rather than the content collection, because the frontmatter both pills show is parsed and validated there. */
export function useDecisionReports() {
    const { data: snapshot } = useSnapshot();

    return computed(() => toDecisionReports(snapshot.value?.docs?.pages ?? []));
}
