import { existsSync, readdirSync, readFileSync } from "node:fs";
import { at } from "../../shared/adapters/git.ts";
import { PROJECT_ROOTS } from "../../shared/domain/layout.ts";
import { parseDecision, type Decision } from "../domain/brief.ts";

const DECISIONS = "docs/decisions";

export const decisions = (): Decision[] =>
    readdirSync(at(DECISIONS))
        .filter((name) => /^\d{4}-.+\.md$/.test(name))
        .map((name) =>
            parseDecision(`${DECISIONS}/${name}`, readFileSync(at(DECISIONS, name), "utf8")),
        );

export const projectDirs = (): string[] =>
    PROJECT_ROOTS.flatMap((root) =>
        readdirSync(at(root), { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map(({ name }) => `${root}/${name}`),
    );

export const exists = (path: string): boolean => existsSync(at(path));
