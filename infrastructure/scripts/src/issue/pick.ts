import { confirm, intro, log, note, outro, select, spinner, text } from "@clack/prompts";
import { branchName, BRANCH_TYPES, slugify } from "./branch.ts";
import { branchForIssue, checkout, createBranch } from "./git.ts";
import { assignToMe, listIssues, listProjects, type Issue } from "./gh.ts";
import { orExit } from "./prompts.ts";

const CANCELLED = "Cancelled — still on the same branch.";

const or = <T>(value: T | symbol): T => orExit(value, CANCELLED);

const pickProject = async (): Promise<string | undefined> => {
    const loading = spinner();
    loading.start("Asking gh what's available...");
    const projects = listProjects();
    loading.stop("Ready.");

    if (projects.length === 0) {
        log.warn("No open projects. If you expected some, the `project` scope is missing: gh auth refresh -s project");
        return undefined;
    }

    return or(
        await select({
            message: "Project",
            options: projects.map(({ title }) => ({ value: title, label: title })),
        }),
    );
};

const pickIssue = async (project: string): Promise<Issue | undefined> => {
    const loading = spinner();
    loading.start(`Reading ${project}...`);
    const issues = listIssues(project);
    loading.stop(`${issues.length} open issue${issues.length === 1 ? "" : "s"}.`);

    if (issues.length === 0) return undefined;

    return or(
        await select({
            message: "Issue",
            maxItems: 12,
            options: issues.map((issue) => ({
                value: issue,
                label: `#${issue.number} ${issue.title}`,
                // The URL rides along in the hint so the terminal turns it into something clickable
                // — that's the whole "let me read the issue before I commit to it" escape hatch.
                hint: [issue.labels.join(", "), issue.url].filter(Boolean).join(" · "),
            })),
        }),
    );
};

/**
 * Runs last and swallows its own failure: the branch is the point of this script, and a repo where
 * you can't assign (or a `gh` without the scope) shouldn't undo one that's already checked out.
 */
const assign = (issue: number): void => {
    try {
        assignToMe(issue);
        log.success(`#${issue} assigned to you.`);
    }
    catch {
        log.warn(`Couldn't assign #${issue} to you — the branch is still yours.`);
    }
};

/**
 * Offers the branch this issue already has, if it has one. Answering no falls through to creating
 * another — a fix branch on top of a feature branch is a real thing, just not the common one.
 */
const resumeBranch = async (issue: number): Promise<boolean> => {
    const existing = branchForIssue(issue);
    if (!existing) return false;

    if (!or(await confirm({ message: `Branch ${existing} already exists — check it out?` }))) return false;

    checkout(existing);
    assign(issue);
    outro(existing);

    return true;
};

const promptBranch = async (issue: Issue): Promise<string> => {
    const type = or(
        await select({
            message: "Branch type",
            options: BRANCH_TYPES.map((value) => ({ value, label: value })),
        }),
    );

    const title = or(
        await text({
            message: "Branch title",
            initialValue: issue.title,
            validate: (value) => (slugify(value ?? "") ? undefined : "Needs at least one letter or digit."),
        }),
    );

    return branchName(type, issue.number, title);
};

export const pick = async (): Promise<void> => {
    intro("🌱 Pick an issue");

    const project = await pickProject();
    if (!project) return;

    const issue = await pickIssue(project);

    if (!issue) {
        log.warn("Nothing open on that project. `pnpm issue:add` fixes that.");
        return;
    }

    if (await resumeBranch(issue.number)) return;

    const branch = await promptBranch(issue);
    note(issue.url, branch);

    try {
        createBranch(branch);
        assign(issue.number);
        outro(branch);
    }
    catch (error) {
        log.error("git checkout -b failed.");
        throw error;
    }
};
