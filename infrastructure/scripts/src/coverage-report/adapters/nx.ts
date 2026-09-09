import { run } from "../../shared/adapters/exec.ts";
import type { ProjectTarget } from "../domain/discover.ts";

const TARGET = "test:coverage";

type NxProject = {
    root: string
    targets: Record<string, { outputs?: string[] }>
};

export const projectsWithCoverage = (): ProjectTarget[] => {
    const names = JSON.parse(run("nx", ["show", "projects", "--with-target", TARGET, "--json"])) as string[];

    return names.map((name) => {
        const project = JSON.parse(run("nx", ["show", "project", name, "--json"])) as NxProject;
        return { name, root: project.root, outputs: project.targets[TARGET]?.outputs ?? [] };
    });
};
