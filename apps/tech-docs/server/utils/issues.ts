import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import type { Issue, IssuesArtifact } from "../../shared/types.ts";
import { WORKSPACE_ROOT } from "../../tools/lib/paths.ts";

const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 20_000;

const LIMIT = "100";

const FIELDS = "number,title,body,url,labels,assignees,projectItems,createdAt,updatedAt";

/**
 * A bare command name resolves by searching `PATH`, so something earlier on it could shadow `gh`
 * with a lookalike. Same fixed, unwriteable locations `@monorepo/scripts` pins, and the same
 * fallback to the bare name for a `gh` installed outside them.
 */
const KNOWN_DIRS = ["/usr/bin", "/usr/local/bin", "/opt/homebrew/bin"];

const GH = KNOWN_DIRS.map((dir) => `${dir}/gh`).find(existsSync) ?? "gh";

/** The shape `gh issue list --json` returns for the fields above; everything else is dropped. */
interface GhIssue {
    number: number
    title: string
    body: string
    url: string
    labels: { name: string }[]
    assignees: { login: string }[]
    projectItems: { title: string, status?: { name: string } | null }[]
    createdAt: string
    updatedAt: string
}

/**
 * The board is a column on the issue rather than a second query. An issue sits on at most one
 * project here, and asking `gh project item-list` for the other case would be two round trips to
 * render one badge.
 */
function toIssue(issue: GhIssue): Issue {
    const [item] = issue.projectItems;

    return {
        number: issue.number,
        title: issue.title,
        body: issue.body ?? "",
        url: issue.url,
        labels: issue.labels.map(({ name }) => name),
        assignees: issue.assignees.map(({ login }) => login),
        project: item?.title ?? null,
        projectStatus: item?.status?.name ?? null,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
    };
}

/**
 * `gh` takes about a second and every page that shows an issue would otherwise pay it on each
 * navigation. One minute is short enough that an issue closed in the browser disappears from here
 * on the next glance, and the page's refresh button skips the window outright.
 */
const TTL_MS = 60_000;

let cache: { at: number, value: IssuesArtifact } | null = null;

async function fetchIssues(): Promise<IssuesArtifact> {
    const fetchedAt = new Date().toISOString();

    try {
        const { stdout } = await execFileAsync(
            GH,
            ["issue", "list", "--state", "open", "--limit", LIMIT, "--json", FIELDS],
            { cwd: WORKSPACE_ROOT, timeout: TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 },
        );

        return { fetchedAt, error: null, issues: (JSON.parse(stdout) as GhIssue[]).map(toIssue) };
    }
    catch (cause) {
        // `gh` explains itself well ("gh auth login", "no default remote repository"), so its own
        // first line is a better answer on the page than anything this could write instead.
        const message = cause instanceof Error ? cause.message : String(cause);

        return { fetchedAt, error: message.split("\n").find(Boolean)?.slice(0, 300) ?? "gh failed", issues: [] };
    }
}

export async function listIssues(refresh = false): Promise<IssuesArtifact> {
    if (!refresh && cache && Date.now() - cache.at < TTL_MS) return cache.value;

    const value = await fetchIssues();

    // A failed fetch is cached too, so an unauthenticated `gh` costs one timeout per minute rather
    // than one per page view.
    cache = { at: Date.now(), value };

    return value;
}
