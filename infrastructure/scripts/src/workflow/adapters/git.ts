import { git } from "../../shared/adapters/git.ts";

/** Every non-merge commit as `<author date>\t<subject>`, the shape `activityByIssue` reads. */
export const commitLog = (): string =>
    git("log", "--no-merges", "--format=%ad%x09%s", "--date=short");
