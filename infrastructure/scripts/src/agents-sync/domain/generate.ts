import { posix } from "node:path";

const NOTICE = (source: string): string =>
    `<!-- Generated from \`${source}\` by \`pnpm agents:sync\`. Edit the source, then rerun the command. -->`;

export const claudeDocPath = (source: string): string =>
    posix.join(posix.dirname(source), "CLAUDE.md");

export const claudeSkillPath = (source: string): string =>
    source.replace(/^\.agents\/skills\//, ".claude/skills/");

export const renderGeneratedMarkdown = (source: string, path: string): string => {
    const notice = NOTICE(path);

    if (!source.startsWith("---\n")) return `${notice}\n\n${source}`;

    const frontmatterEnd = source.indexOf("\n---\n", 4);
    if (frontmatterEnd === -1) return `${notice}\n\n${source}`;

    const split = frontmatterEnd + 5;
    return `${source.slice(0, split)}\n${notice}\n${source.slice(split)}`;
};

export const renderManifest = (files: string[]): string =>
    `${JSON.stringify({ files }, null, 2)}\n`;

export const isManagedTarget = (path: string): boolean => {
    if (
        path.includes("\\")
        || path === ".."
        || path.startsWith("../")
        || posix.isAbsolute(path)
        || posix.normalize(path) !== path
    ) return false;

    if (path.startsWith(".claude/skills/")) return true;
    return !path.startsWith(".claude/") && (path === "CLAUDE.md" || path.endsWith("/CLAUDE.md"));
};

export const staleTargets = (previous: string[], expected: string[]): string[] => {
    const current = new Set(expected);
    return previous.filter((path) => isManagedTarget(path) && !current.has(path));
};
