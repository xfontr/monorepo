import { matchesIssue, matchesLabel, type SearchableIssue } from "./search.ts";

export type ProjectSummary = {
    title: string
    number: number
    url: string
};

export type ProjectSource = "live" | "cache" | "empty";

export type PickIssue = SearchableIssue & {
    url: string
};

export type IssueOption<T> = {
    value: T | PickIssue
    label: string
    hint?: string
};

export const projectLoad = (
    live: ProjectSummary[],
    online: boolean,
): ProjectSource => {
    if (live.length > 0) return "live";
    return online ? "empty" : "cache";
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

export const optionalSelection = (value: string): string | undefined => value || undefined;

export const labelOptionMatches = (
    noneValue: string,
    option: { value: string, hint?: string },
    search: string,
): boolean => option.value === noneValue
    ? !search.trim()
    : matchesLabel({ name: option.value, description: option.hint ?? "" }, search);

export const issueCountMessage = (count: number): string =>
    `${count} open issue${count === 1 ? "" : "s"}.`;

export type IssuePromptText = {
    message: string
    placeholder: string | undefined
    emptyWarning: string | undefined
};

export const issuePromptText = (count: number): IssuePromptText => count === 0
    ? {
        message: "No open issues",
        placeholder: undefined,
        emptyWarning: "Nothing open on that project. `pnpm issue:add` fixes that.",
    }
    : {
        message: "Issue",
        placeholder: "Type a number, a word from the title, or a label",
        emptyWarning: undefined,
    };

export const selectedProject = (
    projects: ProjectSummary[],
    title: string,
): ProjectSummary | undefined => projects.find((project) => project.title === title);
