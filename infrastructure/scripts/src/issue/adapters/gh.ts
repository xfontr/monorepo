import { cached, readCache, writeCache } from "../../shared/adapters/cache.ts";
import { gh } from "../../shared/adapters/gh.ts";
import { slugify } from "../domain/branch.ts";

export type Project = {
    title: string
    number: number
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

/** Whether `gh` is reachable, distinct from `listProjects` swallowing a missing `project` scope the same way. */
export const isOnline = (): boolean => {
    try {
        gh("api", "rate_limit");
        return true;
    }
    catch {
        return false;
    }
};

/** The owner's open projects; empty on a `gh` failure online, the file cache directly when offline. */
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

/** The repo's open issues on the given project; uncached online, the file cache when offline. */
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

/** Assigns `@me`; re-adding an existing assignee is a no-op, so this never checks first. */
export const assignToMe = (issue: number): void =>
    void gh("issue", "edit", String(issue), "--add-assignee", "@me");

/** `gh issue develop` over `git checkout -b`: the branch it creates is linked on the issue's Development panel, which a branch name alone never is. */
export const developBranch = (issue: number, branch: string): void =>
    void gh("issue", "develop", String(issue), "--name", branch, "--checkout");

/** Addressed by name rather than node ID — `item-edit` resolves the field and option server-side instead of a separate `field-list` lookup. */
export const moveToInProgress = (project: Project, issue: Issue): void =>
    void gh("project", "item-edit", String(project.number), "--owner", repoOwner(), "--url", issue.url, "--field", "Status", "--value", "In Progress");
