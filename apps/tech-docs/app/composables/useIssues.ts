import type { IssuesArtifact } from "../../shared/types.ts";

const NO_ISSUES: IssuesArtifact = { fetchedAt: "", error: null, issues: [] };

export function useIssues() {
    const state = useFetch<IssuesArtifact>("/api/issues", { key: "issues", default: () => NO_ISSUES });

    /**
     * The server memoises `gh` for a minute, which is what makes navigating between pages free —
     * so a refresh button has to say so explicitly. The plain `refresh()` would only read the
     * memo back.
     */
    async function reload(): Promise<void> {
        state.data.value = await $fetch<IssuesArtifact>("/api/issues", { query: { refresh: "1" } });
    }

    return { ...state, reload };
}
