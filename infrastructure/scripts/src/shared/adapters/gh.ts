import { assertNotFlagLike, run } from "./exec.ts";

export const gh = (...args: string[]): string => run("gh", args);

export type NewIssue = {
    title: string
    body: string
    label?: string
    project?: string
};

/** Use the locally authenticated `gh`; issue creation returns its URL. */
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
