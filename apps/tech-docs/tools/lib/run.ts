import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { WORKSPACE_ROOT } from "./paths.ts";

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 120_000;

// A clone's `origin` can carry a credential in its URL, and `git config` prints it. Reading repo
// state never needs either subcommand, so they are refused rather than trusted to be unused — the
// collector's output is meant to be shareable.
const ALLOWED_GIT_SUBCOMMANDS = new Set([
    "log",
    "ls-files",
    "rev-list",
    "rev-parse",
    "tag",
]);

export class DisallowedGitSubcommandError extends Error {
    constructor(subcommand: string) {
        super(`git ${subcommand} is not on the collector's allowlist`);
        this.name = "DisallowedGitSubcommandError";
    }
}

/** Runs a command from the workspace root and returns stdout. Never invoked from a server route. */
export async function run(command: string, args: string[], timeout = DEFAULT_TIMEOUT_MS): Promise<string> {
    const { stdout } = await execFileAsync(command, args, {
        cwd: WORKSPACE_ROOT,
        timeout,
        maxBuffer: 32 * 1024 * 1024,
    });

    return stdout;
}

/**
 * Like {@link run}, but a non-zero exit still resolves with whatever reached stdout. Linters report
 * findings *by* failing, so treating their exit code as an error would discard the findings.
 */
export function runAllowFailure(
    command: string,
    args: string[],
    cwd: string,
    timeout = DEFAULT_TIMEOUT_MS,
): Promise<string> {
    return new Promise((settle, reject) => {
        const child = spawn(command, args, { cwd, timeout });

        let stdout = "";
        let stderr = "";

        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk: string) => {
            stdout += chunk;
        });

        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk: string) => {
            stderr += chunk;
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (stdout.length > 0 || code === 0) {
                settle(stdout);

                return;
            }

            reject(new Error(`${command} exited with ${code ?? "no code"}: ${stderr.trim().slice(0, 500)}`));
        });
    });
}

export async function git(args: string[], timeout?: number): Promise<string> {
    const subcommand = args[0] ?? "";

    if (!ALLOWED_GIT_SUBCOMMANDS.has(subcommand)) throw new DisallowedGitSubcommandError(subcommand);

    return run("git", args, timeout);
}

/** Resolves to an error instead of throwing, so one broken collector cannot empty the whole snapshot. */
export async function tryRun<T>(task: () => Promise<T>): Promise<{ ok: true, value: T } | { ok: false, error: string }> {
    try {
        return { ok: true, value: await task() };
    }
    catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
    }
}
