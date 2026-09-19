import type { Issue } from "./types.ts";

const FENCE = /```[\s\S]*?```/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const LINK = /\[([^\]]*)\]\([^)]*\)/g;
const CHECKBOX = /^\s*[-*]\s+\[[ x]\]\s*/gim;
const BULLET = /^\s*[-*>#]+\s*/gm;
const EMPHASIS = /[*_`~]+/g;

/**
 * An issue body is markdown written for GitHub — headings, task lists, a fenced repro. A row shows
 * one line of it, so the syntax is stripped rather than rendered: half-parsed markdown in a clamped
 * string reads as damage, and the full body is one click away on GitHub anyway.
 */
export function summarize(body: string, length = 140): string {
    const text = body
        .replace(FENCE, " ")
        .replace(HTML_COMMENT, " ")
        .replace(LINK, "$1")
        .replace(CHECKBOX, "")
        .replace(BULLET, "")
        .replace(EMPHASIS, "")
        .replace(/\s+/g, " ")
        .trim();

    if (text.length <= length) return text;

    // Cut on a word boundary when there is one near the limit, so the ellipsis never lands
    // mid-word — `adfasdf sdfas fasdf…` rather than `adfasdf sdfas fas…`.
    const cut = text.slice(0, length);
    const space = cut.lastIndexOf(" ");

    return `${(space > length * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export function labelsOf(issues: Issue[]): string[] {
    return [...new Set(issues.flatMap((issue) => issue.labels))].sort();
}

export interface IssueFilter {
    label?: string | "all"
    search?: string
}

export function filterIssues(issues: Issue[], filter: IssueFilter): Issue[] {
    const needle = filter.search?.trim().toLowerCase() ?? "";

    return issues.filter((issue) => {
        if (filter.label && filter.label !== "all" && !issue.labels.includes(filter.label)) return false;
        if (needle.length === 0) return true;

        return `#${issue.number} ${issue.title} ${issue.body}`.toLowerCase().includes(needle);
    });
}

/** The half of GitHub's REST issue payload this app reads; everything else is dropped. */
export interface GithubIssue {
    number: number
    title: string
    body: string | null
    html_url: string
    labels: { name: string }[]
    assignees: { login: string }[]
    created_at: string
    updated_at: string
    /** Set only on a pull request, which the issues endpoint returns alongside the issues. */
    pull_request?: unknown
}

/** `html_url`, not `url` — the latter is the API's own address for the issue and renders as JSON. */
export function toIssue(issue: GithubIssue): Issue {
    return {
        number: issue.number,
        title: issue.title,
        body: issue.body ?? "",
        url: issue.html_url,
        labels: issue.labels.map(({ name }) => name),
        assignees: issue.assignees.map(({ login }) => login),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
    };
}

/** A pull request is an issue to this endpoint and is not one here. */
export function toIssues(payload: GithubIssue[]): Issue[] {
    return payload.filter((item) => item.pull_request === undefined).map(toIssue);
}

/**
 * GitHub's REST host is the repo's own with `api.` in front, so no vendor endpoint is written down.
 * Null when the variable is unset or names no repo, which the page renders as a failure.
 */
export function issuesApiUrl(repoUrl: string): string | null {
    let url: URL;

    try {
        url = new URL(repoUrl);
    }
    catch {
        return null;
    }

    const [owner, repo] = url.pathname.split("/").filter(Boolean);

    if (owner === undefined || repo === undefined) return null;

    return `${url.protocol}//api.${url.host}/repos/${owner}/${repo.replace(/\.git$/, "")}/issues`;
}

export function sortIssues(issues: Issue[]): Issue[] {
    return issues.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.number - a.number);
}
