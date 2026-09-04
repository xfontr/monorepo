import { assertNotFlagLike, run } from "./exec.ts";

export const gh = (...args: string[]): string => run("gh", args);

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
        assertNotFlagLike(title, "title"),
        "--body",
        assertNotFlagLike(body, "body"),
        ...(label ? ["--label", assertNotFlagLike(label, "label")] : []),
        ...(project ? ["--project", assertNotFlagLike(project, "project")] : []),
    );
