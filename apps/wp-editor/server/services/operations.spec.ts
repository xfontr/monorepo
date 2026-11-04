import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { derivedStatus } from "../../shared/rules.ts";
import type { ItemKey, RunReport, Settings } from "../../shared/types.ts";
import { DEFAULT_SETTINGS } from "../../shared/types.ts";
import {
    applyItem,
    bulkApply,
    bulkDryRun,
    dryRunItem,
    markScanned,
    openChangeset,
    repull,
    restoreItem,
    review,
} from "./operations.ts";
import { Refusal } from "../../shared/refusal.ts";
import type { Store } from "../adapters/store.ts";
import { createStore } from "../adapters/store.ts";
import type { WordPress, WpPost } from "../adapters/wordpress.ts";

const KEY: ItemKey = "posts-1";

/** One post whose `modified_gmt` ticks on every write, like WordPress's. */
const fakeWordPress = (content: string) => {
    let tick = 0;
    const post: WpPost = {
        id: 1,
        type: "post",
        status: "draft",
        date: "2026-01-01T00:00:00",
        modified_gmt: "m0",
        link: "",
        title: { raw: "T" },
        excerpt: { raw: "" },
        content: { raw: content },
    };
    const write = (body: { content?: string }) => {
        if (body.content !== undefined) post.content.raw = body.content;
        post.modified_gmt = `m${++tick}`;

        return Promise.resolve(structuredClone(post));
    };

    return {
        post,
        editInWpAdmin: () => write({}),
        wp: {
            get: () => Promise.resolve(structuredClone(post)),
            list: () => Promise.resolve([structuredClone(post)]),
            update: (_type: string, _id: number, body: { content?: string }) => write(body),
        } as unknown as WordPress,
    };
};

let root: string;
let store: Store;

beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "wp-editor-"));
    store = createStore(root);
});

afterEach(async () => {
    await rm(root, { recursive: true, force: true });
});

const propose = async (wp: WordPress, title: string, content: string, override = false) => {
    const { id } = await openChangeset(store, wp, { title, ids: [KEY], override });

    await store.writeProposal(id, KEY, { content });
    await markScanned(store, id, [KEY]);
    await review.confirm(store, id, KEY);

    return id;
};

describe("operations", () => {
    it("refuses a second open changeset, and --override abandons the first", async () => {
        const { wp } = fakeWordPress("a");
        const first = await propose(wp, "one", "b");

        await expect(openChangeset(store, wp, { title: "two", ids: [KEY] })).rejects.toThrow(first);
        await openChangeset(store, wp, { title: "two", ids: [KEY], override: true });

        expect((await store.readChangeset(first))?.status).toBe("abandoned");
    });

    it("refuses to apply over an edit made in wp-admin after the pull, and flags it", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await fake.editInWpAdmin();

        await expect(applyItem(store, fake.wp, id, KEY)).rejects.toThrow(Refusal);
        expect(fake.post.content.raw).toBe("a");
        expect((await store.readItem(id, KEY))?.state.drift).toBe(true);
    });

    it("keeps bulk apply shut below the minimum review level", async () => {
        const { wp } = fakeWordPress("a");
        const { id } = await openChangeset(store, wp, { title: "one", ids: [KEY] });

        await store.writeProposal(id, KEY, { content: "b" });
        await review.seen(store, id, KEY);

        await expect(bulkApply(store, wp, id, 0)).rejects.toThrow(/not yet confirmed/);
    });

    it("keeps the open changeset open when the pull for --override fails", async () => {
        const fake = fakeWordPress("a");
        const first = await propose(fake.wp, "one", "b");
        const failing = { ...fake.wp, get: () => Promise.reject(new Error("offline")) };

        await expect(
            openChangeset(store, failing, { title: "two", ids: [KEY], override: true }),
        ).rejects.toThrow("offline");
        expect((await store.listChangesets()).map(({ id, status }) => [id, status])).toEqual([
            [first, "open"],
        ]);
    });

    it("reopens a closed changeset when a rejected proposal is edited back to life", async () => {
        const { wp } = fakeWordPress("a");
        const id = await propose(wp, "one", "b");

        await review.reject(store, id, KEY);
        expect((await store.readChangeset(id))?.status).toBe("closed");

        await review.edit(store, id, KEY, { content: "c" });
        expect((await store.readChangeset(id))?.status).toBe("open");
    });

    it("refuses to confirm, reject or edit an item that is already applied", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await applyItem(store, fake.wp, id, KEY);

        await expect(review.confirm(store, id, KEY)).rejects.toThrow(Refusal);
        await expect(review.reject(store, id, KEY)).rejects.toThrow(Refusal);
        await expect(review.edit(store, id, KEY, { content: "c" })).rejects.toThrow(Refusal);
    });

    it("refuses an edit without string content instead of writing a broken proposal", async () => {
        const { wp } = fakeWordPress("a");
        const id = await propose(wp, "one", "b");

        await expect(review.edit(store, id, KEY, {})).rejects.toThrow(Refusal);
        expect((await store.readItem(id, KEY))?.proposal).toEqual({ content: "b" });
    });

    it("refuses a re-pull of a restored item, which would erase its restore record", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await applyItem(store, fake.wp, id, KEY);
        await restoreItem(store, fake.wp, id, KEY);

        await expect(repull(store, fake.wp, id, KEY)).rejects.toThrow(Refusal);
        expect((await store.readItem(id, KEY))?.state.restored).toBeDefined();
    });

    // The ticket's end-to-end walk, against the fake instead of a live draft.
    it("restores in stack order: blocked by the later changeset, then back through each base", async () => {
        const fake = fakeWordPress("original");
        const first = await propose(fake.wp, "one", "after one");

        await applyItem(store, fake.wp, first, KEY);

        const second = await propose(fake.wp, "two", "after two");

        await applyItem(store, fake.wp, second, KEY);

        await expect(restoreItem(store, fake.wp, first, KEY)).rejects.toThrow(second);

        await restoreItem(store, fake.wp, second, KEY);
        expect(fake.post.content.raw).toBe("after one");

        await restoreItem(store, fake.wp, first, KEY);
        expect(fake.post.content.raw).toBe("original");
    });

    it("cycles apply and restore on one article without the restore reading as drift", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        for (let round = 0; round < 2; round++) {
            await applyItem(store, fake.wp, id, KEY);
            expect(fake.post.content.raw).toBe("b");

            await restoreItem(store, fake.wp, id, KEY);
            expect(fake.post.content.raw).toBe("a");
        }
    });

    it("puts a restored article back in review, so it can be confirmed and bulk-applied again", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await applyItem(store, fake.wp, id, KEY);
        expect((await restoreItem(store, fake.wp, id, KEY)).level).toBe("seen");

        await expect(bulkApply(store, fake.wp, id, 0)).rejects.toThrow(/not yet confirmed/);
        await review.confirm(store, id, KEY);
        await bulkApply(store, fake.wp, id, 0);

        expect(fake.post.content.raw).toBe("b");
    });

    it("keeps a closed changeset closed when one of its articles is restored", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await applyItem(store, fake.wp, id, KEY);
        await restoreItem(store, fake.wp, id, KEY);

        expect(derivedStatus((await store.readChangeset(id))!, await store.readItems(id))).toBe(
            "closed",
        );
    });

    it("undoes a confirm back to seen, which locks bulk apply again", async () => {
        const { wp } = fakeWordPress("a");
        const id = await propose(wp, "one", "b");

        expect((await review.unconfirm(store, id, KEY)).level).toBe("seen");
        await expect(bulkApply(store, wp, id, 0)).rejects.toThrow(/not yet confirmed/);
    });

    it("undoes a reject, bringing the proposal back and reopening the changeset", async () => {
        const { wp } = fakeWordPress("a");
        const id = await propose(wp, "one", "b");

        await review.reject(store, id, KEY);
        expect((await store.readChangeset(id))?.status).toBe("closed");

        await review.unreject(store, id, KEY);
        expect((await store.readChangeset(id))?.status).toBe("open");
    });

    it("refuses to undo a reject that would leave two changesets open", async () => {
        const { wp } = fakeWordPress("a");
        const first = await propose(wp, "one", "b");

        await review.reject(store, first, KEY);
        await openChangeset(store, wp, { title: "two", ids: [KEY] });

        await expect(review.unreject(store, first, KEY)).rejects.toThrow(/0002-two/);
    });
});

describe("dry runs and reports", () => {
    const useSettings = (overrides: Partial<Settings>) =>
        store.writeSettings({ ...DEFAULT_SETTINGS, ...overrides });

    /** A process killed after the last article, before the final, complete report is written. */
    const killedBeforeFinalReport = (): Store => ({
        ...store,
        writeRun: (id, report) =>
            report.incomplete ? store.writeRun(id, report) : Promise.reject(new Error("killed")),
    });

    it("writes nothing to WordPress in dry-run mode, while a dry run still checks", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await useSettings({ dryRun: true });

        await expect(applyItem(store, fake.wp, id, KEY)).rejects.toThrow(Refusal);
        await expect(bulkApply(store, fake.wp, id, 0)).rejects.toThrow(/dry-run mode/i);
        expect((await dryRunItem(store, fake.wp, id, KEY)).warning).toBeNull();
        expect(fake.post.content.raw).toBe("a");
    });

    it("keeps bulk apply shut until a dry run, and an edit after it shuts it again", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await useSettings({ requireDryRun: true });
        await expect(bulkApply(store, fake.wp, id, 0)).rejects.toThrow(/dry run first/);

        await bulkDryRun(store, fake.wp, id, 0);
        await review.edit(store, id, KEY, { content: "c" });
        await review.confirm(store, id, KEY);
        await expect(bulkApply(store, fake.wp, id, 0)).rejects.toThrow(/run it again/);

        await bulkDryRun(store, fake.wp, id, 0);
        expect((await bulkApply(store, fake.wp, id, 0)).ok).toEqual([KEY]);
        expect(fake.post.content.raw).toBe("c");
    });

    it("saves a report naming the article WordPress failed on instead of aborting the run", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");
        const down = { ...fake.wp, update: () => Promise.reject(new Error("502 Bad Gateway")) };

        const report = await bulkApply(store, down, id, 0);

        expect(report.failed).toEqual([{ key: KEY, reason: "502 Bad Gateway" }]);
        expect(await store.listRuns(id)).toEqual([report]);
    });

    it("leaves an incomplete report of the articles a run reached when it dies before the end", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");
        const dying = killedBeforeFinalReport();

        await expect(bulkApply(dying, fake.wp, id, 0)).rejects.toThrow("killed");

        expect(await store.listRuns(id)).toMatchObject([
            { kind: "apply", incomplete: true, ok: [KEY] },
        ]);
    });

    it("keeps bulk apply shut after a dry run that died before saving its final report", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");
        const dying = killedBeforeFinalReport();

        await useSettings({ requireDryRun: true });
        await expect(bulkDryRun(dying, fake.wp, id, 0)).rejects.toThrow("killed");

        await expect(bulkApply(store, fake.wp, id, 0)).rejects.toThrow(/didn't finish/);
        expect(fake.post.content.raw).toBe("a");
    });

    it("saves a finished run's report once, with no trace of the progress saves", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        const report = await bulkDryRun(store, fake.wp, id, 0);

        expect(report).not.toHaveProperty("incomplete");
        expect(await store.listRuns(id)).toEqual([report]);
    });

    it("stops after three WordPress failures in a row instead of hammering a host that blocks us", async () => {
        const { post, wp } = fakeWordPress("a");
        const keys: ItemKey[] = ["posts-1", "posts-2", "posts-3", "posts-4", "posts-5"];
        const many = {
            ...wp,
            get: (_type: string, id: number) => Promise.resolve({ ...post, id }),
        };
        const { id } = await openChangeset(store, many as WordPress, { title: "many", ids: keys });

        for (const key of keys) await store.writeProposal(id, key, { content: "b" });

        const blocked = { ...wp, get: () => Promise.reject(new Error("403 Forbidden")) };
        const report = await bulkDryRun(store, blocked, id, 0);

        expect(report.failed.map(({ key }) => key)).toEqual(keys.slice(0, 3));
        expect(report.stopped).toMatch(/the 2 after them/);
    });

    it("saves which article it is on and how many there are while the run is going", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");
        const saved: RunReport[] = [];
        const recording: Store = {
            ...store,
            writeRun: (runId, report) => {
                saved.push(structuredClone(report));

                return store.writeRun(runId, report);
            },
        };

        await bulkApply(recording, fake.wp, id, 0);

        expect(saved).toContainEqual(
            expect.objectContaining({ incomplete: true, total: 1, current: KEY, ok: [] }),
        );
        expect(saved.at(-1)).not.toHaveProperty("total");
    });

    it("reports drift found by a dry run as refused, with nothing cleared", async () => {
        const fake = fakeWordPress("a");
        const id = await propose(fake.wp, "one", "b");

        await fake.editInWpAdmin();

        const report = await bulkDryRun(store, fake.wp, id, 0);

        expect(report.refused.map(({ key }) => key)).toEqual([KEY]);
        expect(report.fingerprints).toEqual({});
    });

    it("keeps the change-maker's review request through a hand edit", async () => {
        const { wp } = fakeWordPress("a");
        const id = await propose(wp, "one", "b");

        await store.writeProposal(id, KEY, { content: "b", reviewRequested: "Legal wording" });
        await review.edit(store, id, KEY, { content: "c", reviewRequested: "dropped by the UI" });

        expect((await store.readItem(id, KEY))?.proposal?.reviewRequested).toBe("Legal wording");
    });
});
