import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Refusal } from "../../shared/refusal.ts";
import type { Changeset, ItemKey } from "../../shared/types.ts";
import { createStore, lockStore, stableJson } from "./store.ts";

const BASE = {
    title: "Título",
    excerpt: "",
    content: "<p>uno</p>",
    modifiedGmt: "2026-01-01T00:00:00",
    date: "2026-01-01T00:00:00",
    status: "publish",
    author: "Irene",
    image: null,
    link: "https://blog.test/uno",
};

const CHANGESET: Changeset = {
    id: "0001-test",
    title: "Test",
    instructions: "",
    createdAt: "2026-01-01T00:00:00Z",
    status: "open",
    keys: ["posts-1", "posts-2"],
    scanned: [],
};

let root: string;

beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "wp-editor-"));
});

afterEach(async () => {
    await rm(root, { recursive: true, force: true });
});

describe("store", () => {
    it("writes sorted, 2-space JSON with a trailing newline so the folder diffs cleanly", () => {
        expect(stableJson({ b: 1, a: { d: 2, c: undefined } })).toBe(
            '{\n  "a": {\n    "d": 2\n  },\n  "b": 1\n}\n',
        );
    });

    it("keeps the base html as a raw file, not inside JSON", async () => {
        const store = createStore(root);

        await store.writeBase("0001-test", "posts-1", BASE);

        expect(await readFile(join(root, "changesets/0001-test/base/posts-1.html"), "utf8")).toBe(
            "<p>uno</p>",
        );
    });

    it("lists only items with a proposal or a state, skipping keys left untouched", async () => {
        const store = createStore(root);

        await store.writeChangeset(CHANGESET);
        await store.writeBase("0001-test", "posts-1", BASE);
        await store.writeBase("0001-test", "posts-2", BASE);
        await store.writeProposal("0001-test", "posts-1", { content: "<p>dos</p>" });

        const items = await store.readItems("0001-test");

        expect(items.map(({ key }) => key)).toEqual(["posts-1"]);
        expect(items[0]?.state.level).toBe("unreviewed");
    });

    it("drops the proposal's json when only content is proposed, so a stale title can't linger", async () => {
        const store = createStore(root);

        await store.writeBase("0001-test", "posts-1", BASE);
        await store.writeProposal("0001-test", "posts-1", { content: "a", title: "T" });
        await store.writeProposal("0001-test", "posts-1", { content: "b" });

        expect((await store.readItem("0001-test", "posts-1"))?.proposal).toEqual({ content: "b" });
    });

    it("refuses an id or key that would resolve outside the store", async () => {
        const store = createStore(root);

        await expect(store.readItem("../..", "posts-1")).rejects.toThrow(Refusal);
        await expect(
            store.writeProposal("0001-test", "../../escape" as ItemKey, { content: "x" }),
        ).rejects.toThrow(Refusal);
    });

    it("lists changesets in id order and falls back to default settings on a fresh store", async () => {
        const store = createStore(root);

        await store.writeChangeset({ ...CHANGESET, id: "0002-b" });
        await store.writeChangeset(CHANGESET);

        expect((await store.listChangesets()).map(({ id }) => id)).toEqual(["0001-test", "0002-b"]);
        expect((await store.readSettings()).bulkApplyMinLevel).toBe("confirmed");
    });
});

describe("store lock", () => {
    const holdLock = (pid: number) =>
        writeFile(join(root, ".server.lock"), stableJson({ pid, startedAt: "earlier" }));

    it("refuses a second server on the same store while the first is still running", async () => {
        await holdLock(process.ppid);

        expect(() => lockStore(root)).toThrow(Refusal);
        expect(() => lockStore(root)).toThrow(`pid ${process.ppid}`);
    });

    it("takes over a lock left by a server that died without releasing it", async () => {
        await holdLock(spawnSync(process.execPath, ["-e", ""]).pid);

        lockStore(root);

        expect(JSON.parse(await readFile(join(root, ".server.lock"), "utf8"))).toMatchObject({
            pid: process.pid,
        });
    });

    // The dev mocks live in their own store, so a fake server never blocks the real one.
    it("never blocks a server on a different store", async () => {
        const other = await mkdtemp(join(tmpdir(), "wp-editor-"));

        await holdLock(process.ppid);

        try {
            expect(() => lockStore(other)).not.toThrow();
        } finally {
            await rm(other, { recursive: true, force: true });
        }
    });
});
