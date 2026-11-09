import { appendFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { PROJECT_ROOTS } from "../domain/layout.ts";
import { toLine, type UsageRow } from "../domain/usage.ts";
import { at, git } from "./git.ts";

/** Inside the common `.git`, so every worktree shares one buffer and the working tree stays clean. */
export const usageBufferPath = (log = "scripts"): string =>
    join(git("rev-parse", "--path-format=absolute", "--git-common-dir"), "telemetry", `${log}.csv`);

/** Fails open: a script must never break because its usage could not be written. */
export const appendUsage = (row: UsageRow): void => {
    try {
        const file = usageBufferPath();
        mkdirSync(dirname(file), { recursive: true });
        appendFileSync(file, `${toLine(row)}\n`);
    } catch {
        // No git checkout, a read-only disk: nothing to record into.
    }
};

export const currentBranch = (): string => {
    try {
        return git("branch", "--show-current");
    } catch {
        return "";
    }
};

export const projectNames = (): Set<string> => {
    try {
        return new Set(
            PROJECT_ROOTS.flatMap((root) =>
                readdirSync(at(root), { withFileTypes: true })
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name),
            ),
        );
    } catch {
        return new Set();
    }
};
