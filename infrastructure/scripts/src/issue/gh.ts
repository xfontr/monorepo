import { execFileSync } from "node:child_process";

const gh = (...args: string[]): string => execFileSync("gh", args, { encoding: "utf8" }).trim();

export type Project = {
    title: string
    url: string
};

export type Label = {
    name: string
    description: string
};

export type NewIssue = {
    title: string
    body: string
    label?: string
    project?: string
};

export type Issue = {
    number: number
    title: string
    url: string
    labels: string[]
};

// `gh project list` demands an owner, and the owner of the repo you're standing in is the only
// one this CLI ever has a reason to ask about.
const repoOwner = (): string => gh("repo", "view", "--json", "owner", "--jq", ".owner.login");

/**
 * Returns the owner's open projects, or nothing at all: `gh project list` needs the `project`
 * OAuth scope, which a plain `gh auth login` doesn't grant. Swallowing that is deliberate —
 * missing the scope should cost you the project prompt, not the whole issue.
 */
export const listProjects = (): Project[] => {
    try {
        const { projects } = JSON.parse(gh("project", "list", "--owner", repoOwner(), "--format", "json")) as {
            projects: (Project & { closed: boolean })[]
        };

        return projects.filter(({ closed }) => !closed);
    }
    catch {
        return [];
    }
};

export const listLabels = (): Label[] => JSON.parse(gh("label", "list", "--json", "name,description")) as Label[];

/**
 * The repo's open issues that sit on the given project. Filtering client-side off
 * `--json projectItems` rather than asking `gh project item-list` is one call instead of two, and
 * it gets open-only for free — a project's item list happily hands back closed and draft items.
 */
export const listIssues = (project: string): Issue[] => {
    const issues = JSON.parse(gh("issue", "list", "--state", "open", "--limit", "100", "--json", "number,title,url,labels,projectItems")) as {
        number: number
        title: string
        url: string
        labels: { name: string }[]
        projectItems: { title: string }[]
    }[];

    return issues
        .filter(({ projectItems }) => projectItems.some(({ title }) => title === project))
        .map(({ number, title, url, labels }) => ({ number, title, url, labels: labels.map(({ name }) => name) }));
};

/**
 * `@me` resolves server-side, so this never has to ask who you are, and adding an assignee who is
 * already on the issue is a no-op — no "am I on it already?" round trip either.
 */
export const assignToMe = (issue: number): void =>
    void gh("issue", "edit", String(issue), "--add-assignee", "@me");

/**
 * Shells out to `gh` rather than talking to the GitHub API, so this inherits whatever account is
 * already logged in locally instead of needing a token of its own. Returns the new issue's URL,
 * which is all `gh issue create` prints on success.
 */
export const createIssue = ({ title, body, label, project }: NewIssue): string =>
    gh(
        "issue",
        "create",
        "--title",
        title,
        "--body",
        body,
        ...(label ? ["--label", label] : []),
        ...(project ? ["--project", project] : []),
    );
