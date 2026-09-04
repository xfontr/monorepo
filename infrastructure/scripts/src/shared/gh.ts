import { execFileSync } from "node:child_process";

export const gh = (...args: string[]): string => execFileSync("gh", args, { encoding: "utf8" }).trim();

export type NewIssue = {
    title: string
    body: string
    label?: string
    project?: string
};

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
