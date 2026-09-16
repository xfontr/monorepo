import { toSpikeReports } from "#shared/spikeReports.ts";

/** Read off the collected snapshot rather than the content collection, because the frontmatter both pills show is parsed and validated there. */
export function useSpikeReports() {
    const { data: snapshot } = useSnapshot();

    return computed(() => toSpikeReports(snapshot.value?.docs?.pages ?? []));
}
