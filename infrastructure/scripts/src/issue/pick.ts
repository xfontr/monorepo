import { confirm, intro, log, note, outro, select, spinner, text } from "@clack/prompts";
import { orExit } from "../shared/prompts.ts";
import { branchName, BRANCH_TYPES, slugify } from "./branch.ts";
import { branchForIssue, checkout } from "./git.ts";
import { assignToMe, developBranch, isOnline, listIssues, listProjects, type Issue } from "./gh.ts";

const CANCELLED = "Cancelled — still on the same branch.";

const or = <T>(value: T | symbol): T => orExit(value, CANCELLED);

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
const pickProject = async (): Promise<Picked<string>> => {
    const loading = spinner();
    loading.start("Asking gh what's available...");

    let projects = listProjects();
    let offline = false;

    if (projects.length === 0 && !isOnline()) {
        offline = true;
        loading.message("Reading cached projects...");
        projects = listProjects(true);
    }

    loading.stop("Ready.");
    if (offline) log.warn("gh is unreachable — showing cached projects and issues, which may be outdated.");

    if (projects.length === 0) {
        log.warn(offline
            ? "No cached projects to fall back to — run pick again once you're back online."
            : "No open projects. If you expected some, the `project` scope is missing: gh auth refresh -s project");
        return { value: undefined, offline };
    }

    const value = or(
        await select({
            message: "Project",
            options: projects.map(({ title }) => ({ value: title, label: title })),
        }),
    );

    return { value, offline };
};

/**
 * `knownOffline` short-circuits straight to the cache when `pickProject` already proved gh
 * unreachable. Otherwise this still tries the live fetch first — `listIssues` is deliberately
 * uncached online, so a warm project cache can leave `pickProject` never checking connectivity at
 * all — and only falls back to the cache if that live call actually throws, instead of a second
 * `isOnline()` round trip on every run.
 */
const pickIssue = async (project: string, knownOffline: boolean): Promise<Issue | undefined> => {
    const loading = spinner();
    loading.start(knownOffline ? `Reading cached issues for ${project}...` : `Reading ${project}...`);

    let issues: Issue[];
    try {
        issues = listIssues(project, knownOffline);
    }
    catch {
        loading.message(`Reading cached issues for ${project}...`);
        issues = listIssues(project, true);
    }

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

    const { value: project, offline } = await pickProject();
    if (!project) return;

    const issue = await pickIssue(project, offline);

    if (!issue) {
        log.warn("Nothing open on that project. `pnpm issue:add` fixes that.");
        return;
    }

    if (await resumeBranch(issue.number)) return;

    const branch = await promptBranch(issue);
    note(issue.url, branch);

    try {
        developBranch(issue.number, branch);
        assign(issue.number);
        outro(branch);
    }
    catch (error) {
        log.error("gh issue develop failed.");
        throw error;
    }
};
