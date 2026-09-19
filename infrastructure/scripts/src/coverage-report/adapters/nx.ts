import { spawn } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProjectTarget } from "../domain/discover.ts";

const TARGET = "test:coverage";
const require = createRequire(import.meta.url);
const nxPath = require.resolve("nx/bin/nx.js");
const PATH = "/usr/bin:/bin";

type NxProject = {
    root: string
    targets: Record<string, { outputs?: string[] }>
};

const nx = (args: string[]): Promise<string> =>
    new Promise((resolve, reject) => {
        const directory = mkdtempSync(join(tmpdir(), "coverage-report-nx-"));
        const output = join(directory, "project.json");
        const file = openSync(output, "w");
        const child = spawn(process.execPath, [nxPath, ...args], {
            env: { ...process.env, PATH },
            stdio: ["ignore", file, "pipe"],
        });
        let stderr = "";

        child.stderr?.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        child.on("error", reject);
        child.on("close", (code) => {
            closeSync(file);
            const stdout = readFileSync(output, "utf8").trim();
            rmSync(directory, { recursive: true, force: true });

            if (code !== 0) {
                reject(new Error(stderr.trim() || `nx ${args.join(" ")} exited with ${code}`));
                return;
            }
            resolve(stdout);
        });
    });

export const projectsWithCoverage = async (): Promise<ProjectTarget[]> => {
    const names = JSON.parse(await nx(["show", "projects", "--with-target", TARGET, "--json"])) as string[];

    return Promise.all(names.map(async (name) => {
        const project = JSON.parse(await nx(["show", "project", name, "--json"])) as NxProject;
        return { name, root: project.root, outputs: project.targets[TARGET]?.outputs ?? [] };
    }));
};
