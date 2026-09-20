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
