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

/** Every board named by at least one issue, so the filter offers what is actually there. */
export function projectsOf(issues: Issue[]): string[] {
    return [...new Set(issues.map((issue) => issue.project).filter((name): name is string => name !== null))].sort();
}

export function labelsOf(issues: Issue[]): string[] {
    return [...new Set(issues.flatMap((issue) => issue.labels))].sort();
}

/**
 * "On no board" is the one set a board-shaped filter cannot name, and the one worth finding: work
 * that was filed and never placed. A sentinel rather than `null`, because it travels through a
 * `<select>` value.
 */
export const NO_PROJECT = "__none__";

export interface IssueFilter {
    project?: string | "all"
    label?: string | "all"
    search?: string
}

export function filterIssues(issues: Issue[], filter: IssueFilter): Issue[] {
    const needle = filter.search?.trim().toLowerCase() ?? "";

    return issues.filter((issue) => {
        if (filter.project === NO_PROJECT && issue.project !== null) return false;
        if (filter.project && filter.project !== "all" && filter.project !== NO_PROJECT && issue.project !== filter.project) return false;
        if (filter.label && filter.label !== "all" && !issue.labels.includes(filter.label)) return false;
        if (needle.length === 0) return true;

        return `#${issue.number} ${issue.title} ${issue.body}`.toLowerCase().includes(needle);
    });
}

/**
 * Most recently touched first. A board column would be the better order, but the columns are named
 * per project and nothing here can know which of them means "next" — `gh` reports the name, not a
 * position.
 */
export function sortIssues(issues: Issue[]): Issue[] {
    return issues.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.number - a.number);
}
