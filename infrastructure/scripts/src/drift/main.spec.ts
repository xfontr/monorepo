import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CancelledError } from "../shared/errors.ts";

const prompts = vi.hoisted(() => ({ confirm: vi.fn() }));
const cache = vi.hoisted(() => ({ readCache: vi.fn(), writeCache: vi.fn() }));
const gh = vi.hoisted(() => ({ createIssue: vi.fn() }));
const io = vi.hoisted(() => ({
    isInteractive: vi.fn(),
    out: { warn: vi.fn(), info: vi.fn(), begin: vi.fn(), end: vi.fn() },
}));
const git = vi.hoisted(() => ({
    changedFiles: vi.fn(), diffNameStatus: vi.fn(), diffNumstat: vi.fn(), diffText: vi.fn(), lastMdCommitEpochSeconds: vi.fn(), mergeBase: vi.fn(),
}));
const detect = vi.hoisted(() => ({ displayName: vi.fn(), projectRootsFor: vi.fn(), recordFingerprint: vi.fn(), shouldWarn: vi.fn() }));
const size = vi.hoisted(() => ({ changeSize: vi.fn(), lastMdCommitMs: vi.fn() }));

vi.mock("@clack/prompts", () => prompts);
vi.mock("../shared/adapters/cache.ts", () => cache);
vi.mock("../shared/adapters/gh.ts", () => gh);
vi.mock("../shared/adapters/io.ts", () => io);
vi.mock("../shared/adapters/prompts.ts", () => ({ orExit: (value: unknown, message: string) => {
    if (typeof value === "symbol") throw new CancelledError(message);
    return value;
} }));
vi.mock("./adapters/git.ts", () => git);
vi.mock("./domain/detect.ts", () => detect);
vi.mock("./domain/size.ts", () => size);

import { main } from "./main.ts";

const originalBase = process.env.DOCS_DRIFT_BASE;
const originalHead = process.env.DOCS_DRIFT_HEAD;

beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCS_DRIFT_BASE = "base";
    process.env.DOCS_DRIFT_HEAD = "head";
    io.isInteractive.mockReturnValue(false);
    cache.readCache.mockReturnValue({});
    git.changedFiles.mockReturnValue(["packages/demo/src/index.ts"]);
    detect.projectRootsFor.mockReturnValue(["packages/demo"]);
    detect.displayName.mockReturnValue("Demo");
    detect.recordFingerprint.mockImplementation((seen: Record<string, string>) => ({ seen: { ...seen, "packages/demo": "fingerprint" }, isNew: true }));
    git.diffText.mockReturnValue("diff");
    git.diffNumstat.mockReturnValue(["1\t1\tfile"]);
    git.diffNameStatus.mockReturnValue(["M\tfile"]);
    git.lastMdCommitEpochSeconds.mockReturnValue("1");
    size.lastMdCommitMs.mockReturnValue(1000);
    size.changeSize.mockReturnValue({ linesChanged: 2, filesChanged: 1, renamed: false });
    detect.shouldWarn.mockReturnValue(false);
});

afterEach(() => {
    if (originalBase === undefined) delete process.env.DOCS_DRIFT_BASE;
    else process.env.DOCS_DRIFT_BASE = originalBase;
    if (originalHead === undefined) delete process.env.DOCS_DRIFT_HEAD;
    else process.env.DOCS_DRIFT_HEAD = originalHead;
});

describe("drift main", () => {
    it("does nothing when no project changed or the fingerprint was already seen", async () => {
        detect.projectRootsFor.mockReturnValueOnce([]);
        await main();
        expect(cache.writeCache).not.toHaveBeenCalled();

        detect.projectRootsFor.mockReturnValueOnce(["packages/demo"]);
        detect.recordFingerprint.mockReturnValue({ seen: {}, isNew: false });
        await main();
        expect(git.diffNumstat).not.toHaveBeenCalled();
    });

    it("records a new fingerprint before deciding whether the docs are stale", async () => {
        await main();

        expect(cache.writeCache).toHaveBeenCalledWith("drift-fingerprints", { "packages/demo": "fingerprint" });
        expect(cache.writeCache.mock.invocationCallOrder[0]).toBeLessThan(git.diffNumstat.mock.invocationCallOrder[0]!);
    });

    it("warns non-interactively without prompting and files an issue interactively when accepted", async () => {
        detect.shouldWarn.mockReturnValue(true);
        await main();
        expect(io.out.warn).toHaveBeenCalledWith("packages/demo changed a lot and its docs might be stale.");
        expect(io.out.info).toHaveBeenCalledWith("Run `pnpm docs:drift` to review and file an issue.");
        expect(prompts.confirm).not.toHaveBeenCalled();

        io.isInteractive.mockReturnValue(true);
        prompts.confirm.mockResolvedValue(true);
        gh.createIssue.mockReturnValue("https://example.test/issues/1");
        await main();
        expect(gh.createIssue).toHaveBeenCalledWith({ title: "Address documentation drift for Demo", body: "", project: "Monorepo" });
    });

    it("skips a rejected prompt and turns cancellation into the shared cancellation error", async () => {
        detect.shouldWarn.mockReturnValue(true);
        io.isInteractive.mockReturnValue(true);
        prompts.confirm.mockResolvedValue(false);
        await main();
        expect(gh.createIssue).not.toHaveBeenCalled();

        cache.readCache.mockReturnValue({});
        prompts.confirm.mockResolvedValue(Symbol("cancel"));
        await expect(main()).rejects.toThrow(new CancelledError("Skipped."));
    });
});
