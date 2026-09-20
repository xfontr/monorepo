import type { IssuesArtifact } from "#shared/types.ts";
import type { GithubIssue } from "#shared/issues.ts";
import { issuesApiUrl, toIssues } from "#shared/issues.ts";

const NO_ISSUES: IssuesArtifact = { fetchedAt: "", error: null, issues: [] };

const PER_PAGE = 100;

function messageOf(cause: unknown): string {
    const data = (cause as { data?: { message?: unknown } }).data;

    if (typeof data?.message === "string") return data.message.slice(0, 300);

    return cause instanceof Error ? cause.message.slice(0, 300) : "GitHub could not be read";
}

async function read(repoUrl: string): Promise<IssuesArtifact> {
    const fetchedAt = new Date().toISOString();
    const url = issuesApiUrl(repoUrl);

    if (url === null) return { fetchedAt, error: "NUXT_PUBLIC_REPO_URL is unset, so there is no repo to read.", issues: [] };

    try {
        const payload = await $fetch<GithubIssue[]>(url, { query: { state: "open", per_page: PER_PAGE } });

        return { fetchedAt, error: null, issues: toIssues(payload) };
    }
    catch (cause) {
        return { fetchedAt, error: messageOf(cause), issues: [] };
    }
}

export function useIssues() {
    const { public: { repoUrl } } = useRuntimeConfig();

    const state = useAsyncData<IssuesArtifact>("issues", () => read(repoUrl), {
        default: () => NO_ISSUES,
        server: false, // A baked issue list would ship as old as the deploy.
    });

    return { ...state, reload: state.refresh };
}
