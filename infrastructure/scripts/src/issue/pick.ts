import { autocomplete, confirm, select, text } from "@clack/prompts";
import { out } from "../shared/adapters/io.ts";
import { orExit, type Cancellable } from "../shared/adapters/prompts.ts";
import { ExpectedError } from "../shared/errors.ts";
import { assignToMe, developBranch, isOnline, listIssues, listProjects, moveToInProgress, type Issue, type Project } from "./adapters/gh.ts";
import { branchForIssue, checkout } from "./adapters/git.ts";
import { ISSUE_SCOPE_HINT, projectOptions, PROJECT_SCOPE_HINT } from "./adapters/prompts.ts";
import { branchName, BRANCH_TYPES, slugify } from "./domain/branch.ts";
import {
    issueCountMessage,
    issueOptionMatches,
    issueOptions,
    issuePromptText,
    projectLoad,
    selectedProject,
} from "./domain/pick.ts";
import { issueSource } from "./domain/source.ts";

const CANCELLED = "Cancelled — still on the same branch.";

const or = <T>(value: Cancellable<T>): T => orExit(value, CANCELLED);

const BACK = Symbol("back to project list");

type Picked<T> = {
    value: T | undefined
    offline: boolean
};

const pickProject = async (): Promise<Picked<Project>> => {
    const loading = out.spinner();
    loading.start("Asking gh what's available...");

    const live = listProjects();
    let projects = live;
    const offline = projectLoad(live, live.length > 0 || isOnline()) === "cache";

    if (offline) {
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

    return { value: selectedProject(projects, title), offline };
};

const pickIssue = async (project: Project, knownOffline: boolean): Promise<Issue | typeof BACK> => {
    const loading = out.spinner();
    loading.start(knownOffline ? `Reading cached issues for ${project.title}...` : `Reading ${project.title}...`);

    let issues: Issue[];
    try {
        issues = listIssues(project.title, knownOffline);
    }
    catch {
        const failure = issueSource({ knownOffline, requestFailed: true, online: !knownOffline && isOnline() });

        if (failure === "auth-error") {
            loading.stop("Couldn't read issues.");
            throw new ExpectedError(ISSUE_SCOPE_HINT);
        }

        out.warn("gh is unreachable — showing cached issues, which may be outdated.");
        loading.message(`Reading cached issues for ${project.title}...`);
        issues = listIssues(project.title, true);
    }

    loading.stop(issueCountMessage(issues.length));

    const prompt = issuePromptText(issues.length);
    if (prompt.emptyWarning) out.warn(prompt.emptyWarning);

    return or(
        await autocomplete({
            message: prompt.message,
            placeholder: prompt.placeholder,
            maxItems: 12,
            options: issueOptions(BACK, issues),
            // Keep navigation visible only when the issue search is empty.
            filter: (search, { value }) => issueOptionMatches(BACK, value, search),
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

    // Choosing "← Back to project list" must re-run `pickProject`, not cancel the command.
    for (;;) {
        const { value: project, offline } = await pickProject();
        if (!project) return;

        const issue = await pickIssue(project, offline);
        if (issue === BACK) continue;

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
