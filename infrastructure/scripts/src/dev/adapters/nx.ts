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
 * Nx, not a walk over every `package.json`, decides what's runnable — same reasoning as
 * [`coverage-report/adapters/nx.ts`](../../coverage-report/adapters/nx.ts) asking it about
 * `test:coverage`. It already knows which projects exist and what each declares, so a project added
 * next month appears here without this script learning its name.
 *
 * One query per project root rather than one for the lot, because `--projects` matches on directory
 * — so *which* query answered is the project's layer, with nothing to look up afterwards and no
 * assuming a package's name matches its directory. The alternative, `nx show project <name> --json`
 * per row, costs a subprocess per project and gets slower as the workspace grows; three queries
 * stay three, and a warm daemon answers all of them in about a second.
 */
export const projectsWithDev = (): Runnable[] =>
    PROJECT_ROOTS.flatMap((root) => show("--projects", `${root}/*`).map((name) => ({ root, name })));
