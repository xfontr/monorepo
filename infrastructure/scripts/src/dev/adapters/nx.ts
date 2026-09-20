import { run } from "../../shared/adapters/exec.ts";
import { at } from "../../shared/adapters/git.ts";
import { PROJECT_ROOTS } from "../../shared/domain/layout.ts";
import type { Runnable } from "../domain/projects.ts";

const TARGET = "dev";

/** Resolve Nx from the repo install because this script may run immediately after installing it. */
const nx = (): string => at("node_modules", ".bin", "nx");

const show = (...args: string[]): string[] =>
    JSON.parse(run(nx(), ["show", "projects", "--with-target", TARGET, "--json", ...args])) as string[];

/** Query Nx by project root so project names need not match directory names. */
export const projectsWithDev = (): Runnable[] =>
    PROJECT_ROOTS.flatMap((root) => show("--projects", `${root}/*`).map((name) => ({ root, name })));
