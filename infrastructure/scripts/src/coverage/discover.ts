import { join } from "node:path";

export interface ProjectTarget {
    name: string;
    root: string;
    outputs: string[];
}

export interface ProjectReport {
    name: string;
    coverageFinal: string;
}

/**
 * `nx.json` declares `test:coverage`'s output as the template string `{projectRoot}/coverage`, not
 * a literal path. Resolving it here rather than hardcoding `coverage/` is what lets moving that
 * declaration carry this script with it for free, same argument the spike makes for discovering
 * the project list itself.
 */
const resolveOutput = (name: string, root: string, outputs: string[]): string => {
    const [output] = outputs;
    if (!output) {
        throw new Error(`${name}'s test:coverage declares no output in nx.json — nothing to merge.`);
    }
    return output.replace("{projectRoot}", root);
};

export const toReports = (projects: ProjectTarget[]): ProjectReport[] =>
    projects.map(({ name, root, outputs }) => ({
        name,
        coverageFinal: join(resolveOutput(name, root, outputs), "coverage-final.json"),
    }));
