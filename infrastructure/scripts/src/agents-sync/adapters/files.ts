import {
    chmodSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { at, repoRoot } from "../../shared/adapters/git.ts";

const IGNORED = new Set([
    ".git",
    ".nx",
    ".nuxt",
    ".output",
    ".pnpm-store",
    ".report",
    ".claude",
    "coverage",
    "dist",
    "node_modules",
    "storybook-static",
]);

const walk = (dir: string, accept: (path: string) => boolean, found: string[] = []): string[] => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);

        if (entry.isDirectory() && !IGNORED.has(entry.name)) walk(path, accept, found);
        else if (entry.isFile() && accept(path)) found.push(relative(repoRoot(), path));
    }

    return found;
};

export const instructionFiles = (): string[] =>
    walk(repoRoot(), (path) => path.endsWith("AGENTS.md")).sort();

export const skillFiles = (): string[] => {
    const root = at(".agents", "skills");
    return existsSync(root) ? walk(root, () => true).sort() : [];
};

export const readText = (path: string): string => readFileSync(at(path), "utf8");

export const readBytes = (path: string): Buffer => readFileSync(at(path));

export const modeOf = (path: string): number => statSync(at(path)).mode;

export const writeText = (path: string, contents: string, mode?: number): void => {
    mkdirSync(dirname(at(path)), { recursive: true });
    writeFileSync(at(path), contents);
    if (mode !== undefined) chmodSync(at(path), mode);
};

export const writeBytes = (path: string, contents: Buffer, mode: number): void => {
    mkdirSync(dirname(at(path)), { recursive: true });
    writeFileSync(at(path), contents);
    chmodSync(at(path), mode);
};

export const removeFile = (path: string): void => {
    if (existsSync(at(path))) unlinkSync(at(path));
};

export const matchesText = (path: string, contents: string): boolean =>
    existsSync(at(path)) && readText(path) === contents;

export const matchesBytes = (path: string, contents: Buffer): boolean =>
    existsSync(at(path)) && readBytes(path).equals(contents);

export const MANIFEST_PATH = ".claude/generated.json";

export const readManifest = (): string[] => {
    if (!existsSync(at(MANIFEST_PATH))) return [];

    try {
        const parsed = JSON.parse(readText(MANIFEST_PATH)) as { files?: unknown };
        return Array.isArray(parsed.files) && parsed.files.every((path) => typeof path === "string")
            ? parsed.files
            : [];
    }
    catch {
        return [];
    }
};
