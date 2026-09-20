import { matchesIssue, type SearchableIssue } from "./search.ts";
import { issueSource, type IssueSource } from "./source.ts";

export type ProjectSummary = {
    title: string
    number: number
    url: string
};

export type ProjectLoad = {
    source: "live" | "cache" | "empty"
    projects: ProjectSummary[]
};

export type PickIssue = SearchableIssue & {
    url: string
};

export type IssueLoad = {
    source: IssueSource
    issues: PickIssue[]
};

export type IssueOption<T> = {
    value: T | PickIssue
    label: string
    hint?: string
};

export const projectLoad = (
    live: ProjectSummary[],
    online: boolean,
): ProjectLoad => {
    if (live.length > 0) return { source: "live", projects: live };
    if (online) return { source: "empty", projects: live };
    return { source: "cache", projects: [] };
};

export const issueLoad = (
    knownOffline: boolean,
    requestFailed: boolean,
    online: boolean,
    live: PickIssue[],
    cached: PickIssue[],
): IssueLoad => {
    const source = issueSource({ knownOffline, requestFailed, online });
    if (source === "cache") return { source, issues: cached };
    return { source, issues: live };
};

export const issueOptions = <T>(back: T, issues: PickIssue[]): IssueOption<T>[] => [
    { value: back, label: "← Back to project list" },
    ...issues.map((issue) => ({
        value: issue,
        label: `#${issue.number} ${issue.title}`,
        hint: [issue.labels.join(", "), issue.url].filter(Boolean).join(" · "),
    })),
];

export const issueOptionMatches = <T>(back: T, value: T | PickIssue, search: string): boolean =>
    value === back ? !search.trim() : matchesIssue(value as PickIssue, search);
