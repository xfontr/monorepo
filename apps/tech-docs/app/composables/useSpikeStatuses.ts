import type { SpikeStatus } from "../../shared/types.ts";
import { toCollectionPath } from "../../shared/wiki.ts";

/**
 * Keyed by collection path so `WikiNav` can look a status up beside `WikiEntry.path` without
 * `shared/wiki.ts` carrying a field that comes from the collector rather than from a path —
 * `buildWiki` stays derived from nothing but what `@nuxt/content` found, as its own comment says.
 */
export function useSpikeStatuses() {
    const { data: snapshot } = useSnapshot();

    return computed<Record<string, SpikeStatus>>(() => Object.fromEntries(
        (snapshot.value?.docs?.pages ?? [])
            .filter((page) => page.spikeStatus !== null)
            .map((page) => [toCollectionPath(page.path), page.spikeStatus as SpikeStatus]),
    ));
}
