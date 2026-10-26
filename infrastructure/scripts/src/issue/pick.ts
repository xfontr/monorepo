import { autocomplete, confirm, select, text } from "@clack/prompts";
import { out, requireTerminal } from "../shared/adapters/io.ts";
import { orExit, type Cancellable } from "../shared/adapters/prompts.ts";
import type { Args } from "../shared/cli.ts";
import { optionValue } from "../shared/domain/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import {
    assignToMe,
    developBranch,
    isOnline,
    listIssues,
    listProjects,
    moveToInProgress,
    viewThread,
    type Issue,
    type Project,
} from "./adapters/gh.ts";
import { branchForIssue, checkout } from "./adapters/git.ts";
import { ISSUE_SCOPE_HINT, projectOptions, PROJECT_SCOPE_HINT } from "./adapters/prompts.ts";
import { branchName, branchTypeFor, BRANCH_TYPES, isBranchType, slugify } from "./domain/branch.ts";
import { issueNumberFrom, type IssueThread } from "./domain/brief.ts";
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

const TYPE_HINT = `--type=<${BRANCH_TYPES.join("|")}>`;
const NO_TERMINAL_HINT = `pass an issue number: pnpm issue:pick <number> [${TYPE_HINT}] [--project=<board>] [--title=<branch title>]`;

const or = <T>(value: Cancellable<T>): T => orExit(value, CANCELLED);

const BACK = Symbol("back to project list");

const NO_ARGS: Args = { flags: new Set(), positionals: [] };

interface Picked<T> {
    value: T | undefined;
    offline: boolean;
}

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
    if (offline)
        out.warn("gh is unreachable — showing cached projects and issues, which may be outdated.");

    if (projects.length === 0) {
        out.warn(
            offline
                ? "No cached projects to fall back to — run pick again once you're back online."
                : PROJECT_SCOPE_HINT,
        );
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
    loading.start(
        knownOffline
            ? `Reading cached issues for ${project.title}...`
            : `Reading ${project.title}...`,
    );

    let issues: Issue[];
    try {
        issues = listIssues(project.title, knownOffline);
    } catch {
        const failure = issueSource({
            knownOffline,
            requestFailed: true,
            online: !knownOffline && isOnline(),
        });

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
    } catch {
        out.warn(`Couldn't assign #${issue} to you — the branch is still yours.`);
    }
};

const moveToBoard = (project: Project, issue: Issue): void => {
    try {
        moveToInProgress(project, issue);
        out.success(`#${issue.number} moved to In Progress.`);
    } catch {
        out.warn(`Couldn't move #${issue.number} to In Progress — the branch is still yours.`);
    }
};

const claim = (branch: string, issue: Issue, project: Project | undefined): void => {
    assign(issue.number);
    if (project) moveToBoard(project, issue);
    out.end(branch);
};

const resumeBranch = async (project: Project, issue: Issue): Promise<boolean> => {
    const existing = branchForIssue(issue.number);
    if (!existing) return false;

    if (!or(await confirm({ message: `Branch ${existing} already exists — check it out?` })))
        return false;

    checkout(existing);
    claim(existing, issue, project);

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
            validate: (value) =>
                slugify(value ?? "") ? undefined : "Needs at least one letter or digit.",
        }),
    );

    return branchName(type, project.title, issue.number, title);
};

const boardFor = (title: string): Project | undefined => {
    const project = listProjects().find((candidate) => candidate.title === title);
    if (!project)
        out.warn(`No open board called "${title}" — the issue stays in its board column.`);
    return project;
};

const newBranch = (
    thread: IssueThread,
    board: string | undefined,
    flags: ReadonlySet<string>,
): string => {
    const { number, labels } = thread;
    if (!board)
        throw new ExpectedError(
            `#${number} is on no project board — pass --project=<board title>.`,
        );

    const type = optionValue(flags, "type") ?? branchTypeFor(labels);
    if (!type) {
        throw new ExpectedError(
            `#${number} is labelled ${labels.join(", ") || "nothing"}, which names no branch type — pass ${TYPE_HINT}.`,
        );
    }
    if (!isBranchType(type))
        throw new ExpectedError(`"${type}" isn't a branch type — pass ${TYPE_HINT}.`);

    const title = optionValue(flags, "title") ?? thread.title;
    if (!slugify(title))
        throw new ExpectedError(
            `"${title}" has no letter or digit to slug — pass --title=<branch title>.`,
        );

    const branch = branchName(type, board, number, title);
    developBranch(number, branch);
    return branch;
};

const pickByNumber = (number: number, flags: ReadonlySet<string>): void => {
    out.begin(`🌱 Pick #${number}`);

    const thread = viewThread(number);
    const board = optionValue(flags, "project") ?? thread.boards[0]?.title;

    let branch = branchForIssue(number);
    if (branch) {
        checkout(branch);
        out.info(`Resumed the existing branch for #${number}.`);
    } else {
        branch = newBranch(thread, board, flags);
    }

    const issue: Issue = { number, title: thread.title, url: thread.url, labels: thread.labels };
    claim(branch, issue, board ? boardFor(board) : undefined);
};

export const pick = async ({ positionals, flags }: Args = NO_ARGS): Promise<void> => {
    const [requested] = positionals;
    if (requested) {
        const number = issueNumberFrom(requested);
        if (!number) throw new ExpectedError(`"${requested}" isn't an issue number or URL.`);

        pickByNumber(number, flags);
        return;
    }

    requireTerminal(NO_TERMINAL_HINT);
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
            claim(branch, issue, project);
        } catch (error) {
            out.error("gh issue develop failed.");
            throw error;
        }

        return;
    }
};
