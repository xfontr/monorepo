import { confirm, select, text } from "@clack/prompts";
import { out } from "../shared/adapters/io.ts";
import { orExit } from "../shared/adapters/prompts.ts";
import { assignToMe, developBranch, isOnline, listIssues, listProjects, moveToInProgress, type Issue, type Project } from "./adapters/gh.ts";
import { branchForIssue, checkout } from "./adapters/git.ts";
import { projectOptions, PROJECT_SCOPE_HINT } from "./adapters/prompts.ts";
import { branchName, BRANCH_TYPES, slugify } from "./domain/branch.ts";

const CANCELLED = "Cancelled — still on the same branch.";

const or = <T>(value: T | symbol): T => orExit(value, CANCELLED);

/**
 * A sentinel rather than `undefined`: `pickIssue` already uses `undefined` to mean "this project
 * has nothing open", which should warn and exit, not loop back to the project prompt.
 */
const BACK = Symbol("back to project list");

type Picked<T> = {
    value: T | undefined
    offline: boolean
};

/**
 * Tries the normal, cache-backed online path first — free when the 24h project cache is still
 * warm, since `cached()` never touches the network on a hit. `isOnline()`'s own round trip only
 * runs when that comes back empty, to tell "gh is actually unreachable" apart from "no open
 * projects" or "missing the `project` scope" before paying for a fallback read of the file cache.
 * That keeps the common case — online, warm cache — as instant as `issue:add`'s project prompt.
 */
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

/**
 * `knownOffline` short-circuits straight to the cache when `pickProject` already proved gh
 * unreachable. Otherwise this still tries the live fetch first — `listIssues` is deliberately
 * uncached online, so a warm project cache can leave `pickProject` never checking connectivity at
 * all — and only falls back to the cache if that live call actually throws, instead of a second
 * `isOnline()` round trip on every run.
 */
const pickIssue = async (project: Project, knownOffline: boolean): Promise<Issue | undefined | typeof BACK> => {
    const loading = out.spinner();
    loading.start(knownOffline ? `Reading cached issues for ${project.title}...` : `Reading ${project.title}...`);

    let issues: Issue[];
    try {
        issues = listIssues(project.title, knownOffline);
    }
    catch {
        loading.message(`Reading cached issues for ${project.title}...`);
        issues = listIssues(project.title, true);
    }

    loading.stop(`${issues.length} open issue${issues.length === 1 ? "" : "s"}.`);

    if (issues.length === 0) return undefined;

    return or(
        await select({
            message: "Issue",
            maxItems: 12,
            options: [
                { value: BACK as Issue | typeof BACK, label: "← Back to project list" },
                ...issues.map((issue) => ({
                    value: issue,
                    label: `#${issue.number} ${issue.title}`,
                    // The URL rides along in the hint so the terminal turns it into something
                    // clickable — that's the whole "let me read the issue before I commit to it"
                    // escape hatch.
                    hint: [issue.labels.join(", "), issue.url].filter(Boolean).join(" · "),
                })),
            ],
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
        out.success(`#${issue} assigned to you.`);
    }
    catch {
        out.warn(`Couldn't assign #${issue} to you — the branch is still yours.`);
    }
};

/**
 * Runs right after the assignment and fails the same way: a project without a "Status" field (or
 * one that renamed "In Progress") shouldn't undo the branch or the assignment either.
 */
const moveToBoard = (project: Project, issue: Issue): void => {
    try {
        moveToInProgress(project, issue);
        out.success(`#${issue.number} moved to In Progress.`);
    }
    catch {
        out.warn(`Couldn't move #${issue.number} to In Progress — the branch is still yours.`);
    }
};

/**
 * Offers the branch this issue already has, if it has one. Answering no falls through to creating
 * another — a fix branch on top of a feature branch is a real thing, just not the common one.
 */
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
            return;
        }

        if (await resumeBranch(project, issue)) return;

        const branch = await promptBranch(issue);
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
