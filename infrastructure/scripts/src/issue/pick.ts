import { autocomplete, confirm, select, text } from "@clack/prompts";
import { out } from "../shared/adapters/io.ts";
import { orExit } from "../shared/adapters/prompts.ts";
import { ExpectedError } from "../shared/errors.ts";
import { assignToMe, developBranch, isOnline, listIssues, listProjects, moveToInProgress, type Issue, type Project } from "./adapters/gh.ts";
import { branchForIssue, checkout } from "./adapters/git.ts";
import { ISSUE_SCOPE_HINT, projectOptions, PROJECT_SCOPE_HINT } from "./adapters/prompts.ts";
import { branchName, BRANCH_TYPES, slugify } from "./domain/branch.ts";
import { matchesIssue } from "./domain/search.ts";

const CANCELLED = "Cancelled — still on the same branch.";

const or = <T>(value: T | symbol): T => orExit(value, CANCELLED);

/**
 * A sentinel rather than `undefined`: `pickIssue` already uses `undefined` to mean "this project
 * has nothing open", which loops back to the project prompt the same as this does, but warns first.
 */
const BACK = Symbol("back to project list");

type Picked<T> = {
    value: T | undefined
    offline: boolean
};

const pickProject = async (): Promise<Picked<Project>> => {
    const loading = out.spinner();
    loading.start("Asking gh what's available...");

    let projects = listProjects();
    let offline = false;

    if (projects.length === 0 && !isOnline()) {
        offline = true;
        loading.message("Reading cached projects...");
        projects = listProjects(true);
    }

    loading.stop("Ready.");
    if (offline) out.warn("gh is unreachable — showing cached projects and issues, which may be outdated.");

    if (projects.length === 0) {
        out.warn(offline
            ? "No cached projects to fall back to — run pick again once you're back online."
            : PROJECT_SCOPE_HINT);
        return { value: undefined, offline };
    }

    const title = or(
        await select({
            message: "Project",
            options: projectOptions(projects),
        }),
    );

    return { value: projects.find((project) => project.title === title), offline };
};

const pickIssue = async (project: Project, knownOffline: boolean): Promise<Issue | undefined | typeof BACK> => {
    const loading = out.spinner();
    loading.start(knownOffline ? `Reading cached issues for ${project.title}...` : `Reading ${project.title}...`);

    let issues: Issue[];
    try {
        issues = listIssues(project.title, knownOffline);
    }
    catch {
        // A throw here isn't necessarily offline — a scope/auth error throws the same way a
        // dropped connection does, and only one of those should be served from stale cache.
        if (!knownOffline && isOnline()) {
            loading.stop("Couldn't read issues.");
            throw new ExpectedError(ISSUE_SCOPE_HINT);
        }

        out.warn("gh is unreachable — showing cached issues, which may be outdated.");
        loading.message(`Reading cached issues for ${project.title}...`);
        issues = listIssues(project.title, true);
    }

    loading.stop(`${issues.length} open issue${issues.length === 1 ? "" : "s"}.`);

    if (issues.length === 0) return undefined;

    return or(
        await autocomplete({
            message: "Issue",
            placeholder: "Type a number, a word from the title, or a label",
            maxItems: 12,
            options: [
                { value: BACK as Issue | typeof BACK, label: "← Back to project list" },
                ...issues.map((issue) => ({
                    value: issue,
                    label: `#${issue.number} ${issue.title}`,
                    hint: [issue.labels.join(", "), issue.url].filter(Boolean).join(" · "),
                })),
            ],
            // The back row is navigation, not an issue: it belongs at the top of an unfiltered
            // list and nowhere inside a search for one.
            filter: (search, { value }) => (value === BACK ? !search.trim() : matchesIssue(value, search)),
        }),
    );
};

const assign = (issue: number): void => {
    try {
        assignToMe(issue);
        out.success(`#${issue} assigned to you.`);
    }
    catch {
        out.warn(`Couldn't assign #${issue} to you — the branch is still yours.`);
    }
};

const moveToBoard = (project: Project, issue: Issue): void => {
    try {
        moveToInProgress(project, issue);
        out.success(`#${issue.number} moved to In Progress.`);
    }
    catch {
        out.warn(`Couldn't move #${issue.number} to In Progress — the branch is still yours.`);
    }
};

const resumeBranch = async (project: Project, issue: Issue): Promise<boolean> => {
    const existing = branchForIssue(issue.number);
    if (!existing) return false;

    if (!or(await confirm({ message: `Branch ${existing} already exists — check it out?` }))) return false;

    checkout(existing);
    assign(issue.number);
    moveToBoard(project, issue);
    out.end(existing);

    return true;
};

const promptBranch = async (project: Project, issue: Issue): Promise<string> => {
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

    return branchName(type, project.title, issue.number, title);
};

export const pick = async (): Promise<void> => {
    out.begin("🌱 Pick an issue");

    // A loop rather than a single pass: choosing "← Back to project list" on the issue prompt
    // re-runs `pickProject` instead of unwinding the whole command, which is what cancelling does.
    for (;;) {
        const { value: project, offline } = await pickProject();
        if (!project) return;

        const issue = await pickIssue(project, offline);
        if (issue === BACK) continue;

        if (!issue) {
            out.warn("Nothing open on that project. `pnpm issue:add` fixes that.");
            continue;
        }

        if (await resumeBranch(project, issue)) return;

        const branch = await promptBranch(project, issue);
        out.note(issue.url, branch);

        try {
            developBranch(issue.number, branch);
            assign(issue.number);
            moveToBoard(project, issue);
            out.end(branch);
        }
        catch (error) {
            out.error("gh issue develop failed.");
            throw error;
        }

        return;
    }
};
