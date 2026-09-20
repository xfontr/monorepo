import type { SnapshotResponse } from "../../server/api/snapshot/[artifact].get.ts";

/**
 * `useFetch` keyed per resource, so two pages showing the same list share one request and one
 * `refresh()` updates both. Nothing here writes: every source this app reads — the snapshot, the
 * markdown, GitHub — is owned somewhere else and re-read rather than mirrored.
 */
export function useSnapshot(artifact: keyof Omit<SnapshotResponse, "manifest">) {
    return useFetch<SnapshotResponse>(`/api/snapshot/${artifact}`, { key: `snapshot-${artifact}` });
}
