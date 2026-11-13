import { dirname } from "node:path";
import type { ProjectNode, RetiredProject } from "#layers/snapshot/shared/types.ts";
import { git } from "../lib/run.ts";
import { isDeclaredTag } from "./graph.ts";

const MANIFESTS = [
    "apps/*/package.json",
    "packages/*/package.json",
    "infrastructure/*/package.json",
];

type Deletion = Omit<RetiredProject, "commits">;

/** One project per deleted `package.json`, read from the patch since `git show` is off the allowlist. */
export const parseDeletions = (log: string, live: ProjectNode[]): Deletion[] => {
    const liveNames = new Set(live.map((project) => project.name));
    const seen = new Set<string>();

    return log
        .split("\0")
        .filter(Boolean)
        .flatMap((entry) => {
            const [header = "", ...patch] = entry.split("\n");
            const [commit = "", deletedAt = "", subject = ""] = header.split("\t");

            return patch
                .join("\n")
                .split(/^diff --git /m)
                .slice(1)
                .flatMap((file): Deletion[] => {
                    const path = /^--- a\/(.+)$/m.exec(file)?.[1];
                    const body = file
                        .split("\n")
                        .filter((line) => line.startsWith("-") && !line.startsWith("--- "))
                        .map((line) => line.slice(1))
                        .join("\n");

                    try {
                        const manifest = JSON.parse(body) as {
                            name?: string;
                            nx?: { tags?: string[] };
                        };

                        return path && manifest.name
                            ? [
                                  {
                                      name: manifest.name,
                                      root: dirname(path),
                                      tags: (manifest.nx?.tags ?? []).filter(isDeclaredTag),
                                      deletedAt,
                                      commit,
                                      subject,
                                  },
                              ]
                            : [];
                    } catch {
                        return [];
                    }
                });
        })
        .filter((project) => {
            // A `git mv` reads as a delete plus an add, and the log is newest first.
            if (liveNames.has(project.name) || seen.has(project.name)) return false;
            seen.add(project.name);

            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
};

export const collectRetired = async (live: ProjectNode[]): Promise<RetiredProject[]> => {
    const log = await git([
        "log",
        "--diff-filter=D",
        "-p",
        // A user's diff config would otherwise decide what counts as deleted and how the patch reads.
        "--find-renames",
        "--no-ext-diff",
        "--no-color",
        "--src-prefix=a/",
        "--dst-prefix=b/",
        "--format=%x00%H%x09%cs%x09%s",
        "--",
        ...MANIFESTS,
    ]);

    return Promise.all(
        parseDeletions(log, live).map(async (project) => ({
            ...project,
            commits: Number.parseInt(
                (await git(["rev-list", "--count", project.commit, "--", project.root])).trim(),
                10,
            ),
        })),
    );
};
