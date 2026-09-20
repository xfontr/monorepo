import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { collectScorecards } from "./scorecards.ts";

const state = vi.hoisted(() => ({ files: [] as string[], sources: new Map<string, string>() }));
const fs = vi.hoisted(() => ({ readFile: vi.fn() }));
const invariants = vi.hoisted(() => ({ listReviewFiles: vi.fn() }));

vi.mock("node:fs/promises", () => fs);
vi.mock("../lib/invariants.ts", () => invariants);

const valid = (total: string): string => `## 🧮 Scores

| Card | Score | Δ | Verdict |
| --- | --- | --- | --- |
| 🧱 Architecture | 4/5 | +1 | Solid |
| 🧩 Implementation | 3/5 | 0 | Good |
| 🧪 Testing | 5/5 | +1 | Strong |
| ⚙️ Tooling & DX | 4/5 | 0 | Good |
| 📚 Documentation | 3/5 | -1 | Mixed |
| 🤖 Agent setup | 4/5 | +1 | Good |
| 📋 Process & delivery | 5/5 | 0 | Strong |
| **Total** | **${total}/5** | +0.5 | |
`;

beforeEach(() => {
    vi.clearAllMocks();
    state.files = [];
    state.sources.clear();
    invariants.listReviewFiles.mockImplementation(async () => state.files);
    fs.readFile.mockImplementation(async (path: string) => state.sources.get(path) ?? "");
});

describe("collectScorecards", () => {
    it("skips furniture files while preserving dates, commits, cards and totals newest first", async () => {
        state.files = ["README.md", "TEMPLATE.md", "SCORECARDS.md", "2026-09-18-aaa111.md", "2026-09-20-bbb222.md"];
        state.sources.set(resolve(WORKSPACE_ROOT, "docs/reviews/2026-09-18-aaa111.md"), valid("3.8"));
        state.sources.set(resolve(WORKSPACE_ROOT, "docs/reviews/2026-09-20-bbb222.md"), valid("4.2"));

        const result = await collectScorecards("now");

        expect(result).toEqual({
            generatedAt: "now",
            reviews: [
                expect.objectContaining({ path: "docs/reviews/2026-09-20-bbb222.md", date: "2026-09-20", commit: "bbb222", total: 4.2, totalDelta: "+0.5", parseError: null }),
                expect.objectContaining({ path: "docs/reviews/2026-09-18-aaa111.md", date: "2026-09-18", commit: "aaa111", total: 3.8, cards: expect.any(Array), parseError: null }),
            ],
        });
        expect(result.reviews[0]?.cards).toHaveLength(7);
        expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it("keeps readable score rows while turning a malformed table shape into parseError", async () => {
        state.files = ["2026-09-20-bad123.md"];
        state.sources.set(resolve(WORKSPACE_ROOT, "docs/reviews/2026-09-20-bad123.md"), `## 🧮 Scores
| Card | Score |
| --- | --- |
| 🧱 Architecture | 4/5 |
| **Total** | **4/5** |
`);

        const result = await collectScorecards("now");

        expect(result.reviews[0]).toMatchObject({
            cards: [{ card: "🧱 Architecture", score: 4 }],
            total: 4,
            parseError: expect.stringContaining("missing card row(s)"),
        });
    });

    it("returns an empty artifact when no review files exist", async () => {
        await expect(collectScorecards("now")).resolves.toEqual({ generatedAt: "now", reviews: [] });
        expect(fs.readFile).not.toHaveBeenCalled();
    });
});
