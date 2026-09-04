import type { Label, Project } from "./gh.ts";

/** An empty pick, which `createIssue` turns into an omitted flag rather than an empty one. */
const NONE = "";

export const NONE_OPTION = { value: NONE, label: "— none —" };

/**
 * Both commands hit this: an empty project list reads as "there are none" when the likelier cause
 * is a token without the scope to see them, so the fix goes in the message rather than a doc.
 */
export const PROJECT_SCOPE_HINT
    = "No open projects. If you expected some, the `project` scope is missing: gh auth refresh -s project";

export const projectOptions = (projects: Project[]): { value: string, label: string }[] =>
    projects.map(({ title }) => ({ value: title, label: title }));

export const labelOptions = (labels: Label[]): { value: string, label: string, hint?: string }[] =>
    labels.map(({ name, description }) => ({ value: name, label: name, hint: description || undefined }));
