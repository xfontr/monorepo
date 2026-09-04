import { confirm } from "@clack/prompts";
import process from "node:process";
import { readCache, writeCache } from "../shared/cache.ts";
import { createIssue } from "../shared/gh.ts";
import { isInteractive, out } from "../shared/io.ts";
import { orExit } from "../shared/prompts.ts";
import {
    displayName,
    fingerprint,
    hasRename,
    parseLinesChanged,
    projectRootsFor,
    shouldWarn,
} from "./detect.ts";
import { changedFiles, diffNameStatus, diffNumstat, diffText, lastMdCommitEpochSeconds, mergeBase } from "./git.ts";

// The board this repo actually files drift issues onto — see `gh project list`. There's no picker
// here on purpose: this flow exists specifically to skip `issue:add`'s prompts.
const PROJECT = "Monorepo";
const CACHE_KEY = "drift-fingerprints";

const lastMdCommitMs = (root: string): number | undefined => {
    const seconds = lastMdCommitEpochSeconds(root);
    return seconds ? Number(seconds) * 1000 : undefined;
};

const warnFor = async (root: string): Promise<void> => {
    const name = displayName(root);
    out.warn(`${root} changed a lot and its docs might be stale.`);

    // A non-interactive push (CI, a GUI git client) has nobody to answer the prompt below — leave
    // a pointer instead of hanging the push on an unanswerable question.
    if (!isInteractive()) {
        out.info("Run `pnpm docs:drift` to review and file an issue.");
        return;
    }

    out.begin(`📚 Possible docs drift — ${name}`);

    const wantsIssue = orExit(await confirm({ message: "File a GitHub issue for it?" }), "Skipped.");

    if (!wantsIssue) {
        out.end("Skipped — won't ask again until this project changes further.");
        return;
    }

    // No description: the issue exists to get the project back in front of a human, not to
    // pre-judge what changed. Whoever picks it up reads the diff themselves.
    const url = createIssue({ title: `Address documentation drift for ${name}`, body: "", project: PROJECT });
    out.end(url);
};

export const main = async (): Promise<void> => {
    // Read here rather than at module scope so importing this file doesn't shell out to `git`.
    const base = process.env.DOCS_DRIFT_BASE ?? mergeBase("master");
    const head = process.env.DOCS_DRIFT_HEAD ?? "HEAD";

    const roots = projectRootsFor(changedFiles(base, head));
    if (roots.length === 0) return;

    const seen = readCache<Record<string, string>>(CACHE_KEY) ?? {};

    for (const root of roots) {
        const diffFingerprint = fingerprint(diffText(base, head, root));
        if (seen[root] === diffFingerprint) continue;

        seen[root] = diffFingerprint;
        // Written before the prompt below, so a Ctrl+C mid-run still counts this diff as seen
        // rather than warning again for the exact same change on the next push.
        writeCache(CACHE_KEY, seen);

        const numstat = diffNumstat(base, head, root);
        const size = {
            linesChanged: parseLinesChanged(numstat),
            filesChanged: numstat.length,
            renamed: hasRename(diffNameStatus(base, head, root)),
        };

        if (!shouldWarn(size, lastMdCommitMs(root))) continue;

        await warnFor(root);
    }
};
