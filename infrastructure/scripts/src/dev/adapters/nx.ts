import { run } from "../../shared/adapters/exec.ts";
import { at } from "../../shared/adapters/git.ts";
import { PROJECT_ROOTS } from "../../shared/domain/layout.ts";
import type { Runnable } from "../domain/projects.ts";

const TARGET = "dev";

/**
 * The one place that spells out `node_modules/.bin` rather than trusting `nx` on `PATH`, which
 * [`coverage-report`](../../coverage-report/adapters/nx.ts) can do safely. This script may have
 * *just* installed the workspace, and `pnpm` built this process' `PATH` before that install
 * existed — the binary this needs is the one the install put at the repo root, by name.
 */
const nx = (): string => at("node_modules", ".bin", "nx");

const show = (...args: string[]): string[] =>
    JSON.parse(run(nx(), ["show", "projects", "--with-target", TARGET, "--json", ...args])) as string[];

/**
 * Nx decides what's runnable, not a walk over every `package.json` — same reasoning as
 * [`coverage-report/adapters/nx.ts`](../../coverage-report/adapters/nx.ts) asking about
 * `test:coverage`. One query per project root, not one for the lot, because `--projects` matches on
 * directory — cheaper than one `nx show project <name> --json` per row, and it never has to guess
 * that a package's name matches its directory.
 */
export const projectsWithDev = (): Runnable[] =>
    PROJECT_ROOTS.flatMap((root) => show("--projects", `${root}/*`).map((name) => ({ root, name })));
