import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";
import { at } from "../../shared/adapters/git.ts";
import type { Snapshot } from "../domain/snapshot.ts";

export const PROJECTS_DIR = "docs/workflows/projects";

export const projectIds = (): string[] =>
    existsSync(at(PROJECTS_DIR))
        ? readdirSync(at(PROJECTS_DIR))
              .filter((file) => file.endsWith(".yaml"))
              .map((file) => file.replace(/\.yaml$/, ""))
              .sort((a, b) => a.localeCompare(b))
        : [];

/** The parsed project file, null when it doesn't exist; a YAML error throws with its line. */
export const readProject = (id: string): unknown => {
    const path = at(PROJECTS_DIR, `${id}.yaml`);
    return existsSync(path) ? (parse(readFileSync(path, "utf8")) as unknown) : null;
};

export const snapshotPath = (id: string): string => `${PROJECTS_DIR}/${id}.snapshot.json`;

export const readSnapshot = (id: string): Snapshot | null => {
    try {
        return JSON.parse(readFileSync(at(snapshotPath(id)), "utf8")) as Snapshot;
    } catch {
        return null;
    }
};

export const writeSnapshot = (id: string, snapshot: Snapshot): void =>
    writeFileSync(at(snapshotPath(id)), `${JSON.stringify(snapshot, null, 4)}\n`, "utf8");
