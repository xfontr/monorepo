export function repoApiUrl(repoUrl: string, resource: string): string | null {
    let url: URL;

    try {
        url = new URL(repoUrl);
    }
    catch {
        return null;
    }

    const [owner, repo] = url.pathname.split("/").filter(Boolean);

    if (owner === undefined || repo === undefined) return null;

    return `${url.protocol}//api.${url.host}/repos/${owner}/${repo.replace(/\.git$/, "")}/${resource}`;
}

/** GitHub's own error text, such as the rate-limit notice, rather than the fetch client's status line. */
export function messageOf(cause: unknown, fallback: string): string {
    const data = (cause as { data?: { message?: unknown } } | null)?.data;

    if (typeof data?.message === "string") return data.message.slice(0, 300);

    return cause instanceof Error ? cause.message.slice(0, 300) : fallback;
}
