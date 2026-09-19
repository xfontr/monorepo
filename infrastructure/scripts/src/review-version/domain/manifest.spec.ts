import { describe, expect, it } from "vitest";
import { digestOf, METHOD_ARTIFACTS, parseManifest, staleArtifacts, updateManifest } from "./manifest.ts";

const MANIFEST = `# 🔒 Method version

Method **version 2**.

| Artifact | Digest |
| --- | --- |
| \`docs/reviews/SCORECARDS.md\` | \`aaaaaaaaaaaa\` |
| \`.agents/skills/repo-review/SKILL.md\` | \`bbbbbbbbbbbb\` |
| \`.claude/agents/repo-review-card.md\` | \`cccccccccccc\` |
| \`.agents/skills/repo-review/collect-facts.sh\` | \`dddddddddddd\` |

Prose below the table.
`;

const RECORDED = {
    "docs/reviews/SCORECARDS.md": "aaaaaaaaaaaa",
    ".agents/skills/repo-review/SKILL.md": "bbbbbbbbbbbb",
    ".claude/agents/repo-review-card.md": "cccccccccccc",
    ".agents/skills/repo-review/collect-facts.sh": "dddddddddddd",
};

describe("parseManifest", () => {
    it("reads a digest for every artifact that decides a score, not only the versioned one", () => {
        const parsed = parseManifest(MANIFEST);

        expect(parsed?.version).toBe(2);
        expect(Object.keys(parsed?.digests ?? {}).sort()).toStrictEqual([...METHOD_ARTIFACTS].sort());
    });

    it("reports a manifest with no version line as unreadable rather than as version zero", () => {
        expect(parseManifest("# 🔒 Method version\n\nNo version here.\n")).toBeNull();
    });
});

describe("staleArtifacts", () => {
    it("passes a tree whose four artifacts still match what the version recorded", () => {
        expect(staleArtifacts(parseManifest(MANIFEST), RECORDED)).toStrictEqual([]);
    });

    // SKILL.md, the card agent and collect-facts.sh carry no version of their own, so editing one
    // used to move every future score with nothing to notice.
    it("names an unversioned artifact that moved, so a score can't be attributed to a method that didn't produce it", () => {
        const stale = staleArtifacts(parseManifest(MANIFEST), {
            ...RECORDED,
            ".agents/skills/repo-review/SKILL.md": "999999999999",
        });

        expect(stale).toStrictEqual([".agents/skills/repo-review/SKILL.md"]);
    });

    it("treats an unreadable manifest as every artifact stale rather than as nothing to check", () => {
        expect(staleArtifacts(null, RECORDED)).toStrictEqual([...METHOD_ARTIFACTS]);
    });
});

describe("updateManifest", () => {
    it("bumps the version off the digest change, so the bump can't be the step someone forgets", () => {
        const next = updateManifest(MANIFEST, { ...RECORDED, "docs/reviews/SCORECARDS.md": "111111111111" });

        expect(parseManifest(next)?.version).toBe(3);
        expect(parseManifest(next)?.digests["docs/reviews/SCORECARDS.md"]).toBe("111111111111");
    });

    it("leaves the version alone when nothing moved, so re-running it is not a bump", () => {
        expect(updateManifest(MANIFEST, RECORDED)).toBe(MANIFEST);
    });

    it("leaves a manifest with no digest table alone rather than bumping into a file that can't record it", () => {
        const malformed = "# 🔒 Method version\n\nMethod **version 2**.\n\nSomeone deleted the table.\n";

        expect(updateManifest(malformed, RECORDED)).toBe(malformed);
    });

    it("keeps the prose around the table, which is the half a person edits", () => {
        const next = updateManifest(MANIFEST, { ...RECORDED, ".claude/agents/repo-review-card.md": "222222222222" });

        expect(next).toContain("Prose below the table.");
        expect(next.split("\n").filter((line) => line.startsWith("| `")).length).toBe(METHOD_ARTIFACTS.length);
    });
});

describe("digestOf", () => {
    it("moves when a byte does, which is the only reason the manifest can be trusted", () => {
        expect(digestOf("a")).not.toBe(digestOf("b"));
        expect(digestOf("a")).toHaveLength(12);
    });
});
