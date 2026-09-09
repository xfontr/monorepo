import { join } from "node:path";
import { ExpectedError } from "../../shared/errors.ts";

export type ProjectTarget = {
    name: string
    root: string
    outputs: string[]
};

export type ProjectReport = {
    name: string
    coverageFinal: string
};

const resolveOutput = (name: string, root: string, outputs: string[]): string => {
    const [output] = outputs;
    if (!output) {
        throw new ExpectedError(`${name}'s test:coverage declares no output in nx.json — nothing to merge.`);
    }
    return output.replace("{projectRoot}", root);
};

export const toReports = (projects: ProjectTarget[]): ProjectReport[] =>
    projects.map(({ name, root, outputs }) => ({
        name,
        coverageFinal: join(resolveOutput(name, root, outputs), "coverage-final.json"),
    }));
