import { readFileSync, writeFileSync } from "node:fs";
import { at } from "../../shared/adapters/git.ts";
import { digestOf, METHOD_ARTIFACTS, type Digests } from "../domain/manifest.ts";

export const METHOD_PATH = "docs/reviews/METHOD.md";

export const readManifest = (): string => readFileSync(at(METHOD_PATH), "utf8");

export const writeManifest = (markdown: string): void => writeFileSync(at(METHOD_PATH), markdown, "utf8");

/** A missing artifact digests as empty rather than throwing, so the check reports it as moved instead of crashing. */
export const digestArtifacts = (): Digests =>
    Object.fromEntries(METHOD_ARTIFACTS.map((path) => {
        try {
            return [path, digestOf(readFileSync(at(path), "utf8"))];
        }
        catch {
            return [path, ""];
        }
    }));
