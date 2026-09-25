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
        // The `=` form keeps a value starting with `-`, such as a markdown checklist, from reading as a flag.
        `--title=${title}`,
        `--body=${body}`,
        ...(label ? ["--label", assertNotFlagLike(label, "label")] : []),
        ...(project ? ["--project", assertNotFlagLike(project, "project")] : []),
    );
