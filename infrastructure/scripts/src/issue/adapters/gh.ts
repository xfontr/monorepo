import { cached, readCache, writeCache } from "../../shared/adapters/cache.ts";
import { gh } from "../../shared/adapters/gh.ts";
import { slugify } from "../domain/branch.ts";

export type Project = {
    title: string
    url: string
};

export type Label = {
    name: string
    description: string
};

export type Issue = {
    number: number
    title: string
    url: string
    labels: string[]
};

// `gh project list` demands an owner, and the owner of the repo you're standing in is the only
// one this CLI ever has a reason to ask about.
const repoOwner = (): string => gh("repo", "view", "--json", "owner", "--jq", ".owner.login");

/**
 * A cheap, scope-free round trip used only to tell "gh is unreachable" apart from "missing the
 * `project` scope" — `listProjects` already swallows the latter to mean something else, so offline
 * detection needs its own signal rather than reading that catch.
 */
export const isOnline = (): boolean => {
    try {
        gh("api", "rate_limit");
        return true;
    }
    catch {
        return false;
    }
};

/**
 * Returns the owner's open projects. Online, `gh project list` failing (most often the missing
 * `project` scope, which a plain `gh auth login` doesn't grant) is swallowed to an empty list —
 * that should cost you the project prompt, not the whole issue. Offline, there's no fetch to fall
 * back from failing, so this reads the cache directly instead of paying for a doomed round trip.
 */
export const listProjects = (offline = false): Project[] => {
    if (offline) return readCache<Project[]>("projects") ?? [];

    return cached("projects", () => {
        try {
            const { projects } = JSON.parse(gh("project", "list", "--owner", repoOwner(), "--format", "json")) as {
                projects: (Project & { closed: boolean })[]
            };

            return projects.filter(({ closed }) => !closed);
        }
        catch {
            return [];
        }
    });
};

export const listLabels = (): Label[] => cached("labels", () =>
    JSON.parse(gh("label", "list", "--json", "name,description")) as Label[]);

/**
 * The repo's open issues that sit on the given project. Filtering client-side off
 * `--json projectItems` rather than asking `gh project item-list` is one call instead of two, and
 * it gets open-only for free — a project's item list happily hands back closed and draft items.
 *
 * Deliberately not behind `cached`'s TTL: online, this fetches and overwrites the cache on every
 * call, because a stale issue list is the one answer this flow exists to avoid. Offline, that same
 * cache is the only answer there is.
 */
export const listIssues = (project: string, offline = false): Issue[] => {
    const key = `issues-${slugify(project)}`;

    if (offline) return readCache<Issue[]>(key) ?? [];

    const issues = JSON.parse(gh("issue", "list", "--state", "open", "--limit", "100", "--json", "number,title,url,labels,projectItems")) as {
        number: number
        title: string
        url: string
        labels: { name: string }[]
        projectItems: { title: string }[]
    }[];

    const forProject = issues
        .filter(({ projectItems }) => projectItems.some(({ title }) => title === project))
        .map(({ number, title, url, labels }) => ({ number, title, url, labels: labels.map(({ name }) => name) }));

    writeCache(key, forProject);

    return forProject;
};

/**
 * `@me` resolves server-side, so this never has to ask who you are, and adding an assignee who is
 * already on the issue is a no-op — no "am I on it already?" round trip either.
 */
export const assignToMe = (issue: number): void =>
    void gh("issue", "edit", String(issue), "--add-assignee", "@me");

/**
 * `gh issue develop` over `git checkout -b`: the branch it creates is linked on the issue's
 * Development panel, which a branch name alone never is, no matter how it's formatted. No `--base`
 * means it comes off the repo's default branch rather than whatever's checked out — see the
 * deferred table in the README for the one workflow that trades away.
 */
export const developBranch = (issue: number, branch: string): void =>
    void gh("issue", "develop", String(issue), "--name", branch, "--checkout");
