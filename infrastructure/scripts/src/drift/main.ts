import { confirm } from "@clack/prompts";
import process from "node:process";
import { readCache, writeCache } from "../shared/adapters/cache.ts";
import { createIssue } from "../shared/adapters/gh.ts";
import { isInteractive, out } from "../shared/adapters/io.ts";
import { orExit } from "../shared/adapters/prompts.ts";
import { changedFiles, diffNameStatus, diffNumstat, diffText, lastMdCommitEpochSeconds, mergeBase } from "./adapters/git.ts";
import {
    displayName,
    projectRootsFor,
    recordFingerprint,
    shouldWarn,
} from "./domain/detect.ts";
import { changeSize, lastMdCommitMs } from "./domain/size.ts";

const PROJECT = "Monorepo";
const CACHE_KEY = "drift-fingerprints";

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

    const url = createIssue({ title: `Address documentation drift for ${name}`, body: "", project: PROJECT });
    out.end(url);
};

export const main = async (): Promise<void> => {
    const base = process.env.DOCS_DRIFT_BASE ?? mergeBase("master");
    const head = process.env.DOCS_DRIFT_HEAD ?? "HEAD";

    const roots = projectRootsFor(changedFiles(base, head));
    if (roots.length === 0) return;

    let seen = readCache<Record<string, string>>(CACHE_KEY) ?? {};

    for (const root of roots) {
        const transition = recordFingerprint(seen, root, diffText(base, head, root));
        if (!transition.isNew) continue;

        seen = transition.seen;
        writeCache(CACHE_KEY, seen);

        const numstat = diffNumstat(base, head, root);
        const size = changeSize(numstat, diffNameStatus(base, head, root));

        if (!shouldWarn(size, lastMdCommitMs(lastMdCommitEpochSeconds(root)))) continue;

        await warnFor(root);
    }
};
