import { createHash } from "node:crypto";

/** The definition of the review method — `METHOD.md`'s digest table is written from this list, never the reverse. */
export const METHOD_ARTIFACTS = [
    "docs/reviews/SCORECARDS.md",
    ".claude/skills/repo-review/SKILL.md",
    ".claude/agents/repo-review-card.md",
    ".claude/skills/repo-review/collect-facts.sh",
] as const;

export type Digests = Record<string, string>;

export type Manifest = {
    version: number
    digests: Digests
};

const VERSION_LINE = /(Method \*\*version )(\d+)(\*\*)/;
const DIGEST_ROW = /^\| `([^`]+)` \| `([0-9a-f]+)` \|$/;

/** 12 hex characters so a bump is legible in a diff; collisions between two markdown files are not the threat here. */
export const digestOf = (source: string): string =>
    createHash("sha256").update(source).digest("hex").slice(0, 12);

export const parseManifest = (markdown: string): Manifest | null => {
    const version = VERSION_LINE.exec(markdown)?.[2];

    if (version === undefined) return null;

    const digests: Digests = {};

    for (const line of markdown.split("\n")) {
        const row = DIGEST_ROW.exec(line.trim());

        if (row?.[1] && row[2]) digests[row[1]] = row[2];
    }

    return { version: Number.parseInt(version, 10), digests };
};

export const staleArtifacts = (manifest: Manifest | null, digests: Digests): string[] =>
    manifest === null ? [...METHOD_ARTIFACTS] : METHOD_ARTIFACTS.filter((path) => manifest.digests[path] !== digests[path]);

/** Rewrites the version line and the rows in place, never the file, so the prose around them stays hand-written. */
export const updateManifest = (markdown: string, digests: Digests): string => {
    const changed = staleArtifacts(parseManifest(markdown), digests).length > 0;
    const rows = METHOD_ARTIFACTS.map((path) => `| \`${path}\` | \`${digests[path] ?? ""}\` |`);

    let seen = false;

    const lines = markdown.split("\n").flatMap((line) => {
        if (!DIGEST_ROW.test(line.trim())) return [line];
        if (seen) return [];

        seen = true;

        return rows;
    });

    // A manifest with no table can't record what a bump would mean, so refuse rather than climb the
    // version on every run against a file that will never match.
    if (!seen) return markdown;
    if (!changed) return lines.join("\n");

    return lines.join("\n").replace(
        VERSION_LINE,
        (_, before: string, version: string, after: string) => `${before}${Number.parseInt(version, 10) + 1}${after}`,
    );
};
