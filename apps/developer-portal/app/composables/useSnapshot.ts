import type { SnapshotResponse } from "../../server/api/snapshot.get.ts";

/**
 * `useFetch` keyed per resource, so two pages showing the same list share one request and one
 * `refresh()` updates both. Nothing here writes: every source this app reads — the snapshot, the
 * markdown, GitHub — is owned somewhere else and re-read rather than mirrored.
 */
export function useSnapshot() {
    return useFetch<SnapshotResponse>("/api/snapshot", { key: "snapshot" });
}
