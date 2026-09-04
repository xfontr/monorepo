import { run } from "../shared/exec.ts";
import type { ProjectTarget } from "./discover.ts";

const TARGET = "test:coverage";

interface NxProject {
    root: string;
    targets: Record<string, { outputs?: string[] }>;
}

/**
 * Nx, not a glob, is the source of truth for what to merge — see the spike. Reading each project's
 * declared `outputs` here, instead of assuming `coverage/`, is what lets an eighth project or a
 * moved output directory carry this script with it instead of silently falling out of the merge.
 */
export const projectsWithCoverage = (): ProjectTarget[] => {
    const names = JSON.parse(run("nx", ["show", "projects", "--with-target", TARGET, "--json"])) as string[];

    return names.map((name) => {
        const project = JSON.parse(run("nx", ["show", "project", name, "--json"])) as NxProject;
        return { name, root: project.root, outputs: project.targets[TARGET]?.outputs ?? [] };
    });
};
