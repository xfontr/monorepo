import type { SpikeStatus } from "../../shared/types.ts";
import { toCollectionPath } from "../../shared/wiki.ts";

/** Keyed by collection path so `WikiNav` can look a status up beside `WikiEntry.path`, without `shared/wiki.ts` itself depending on anything the collector — not the path — produced. */
export function useSpikeStatuses() {
    const { data: snapshot } = useSnapshot();

    return computed<Record<string, SpikeStatus>>(() => Object.fromEntries(
        (snapshot.value?.docs?.pages ?? [])
            .filter((page) => page.spikeStatus !== null)
            .map((page) => [toCollectionPath(page.path), page.spikeStatus as SpikeStatus]),
    ));
}
