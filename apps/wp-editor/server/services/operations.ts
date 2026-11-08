import { markersDiffer } from "../../shared/blockMarkers.ts";
import {
    afterEdit,
    appliedText,
    bulkApplyBlocker,
    bulkRestoreBlocker,
    confirm,
    derivedStatus,
    driftRefusal,
    expectedModified,
    gateBlocker,
    holdsText,
    isApplied,
    itemFingerprint,
    isPending,
    markSeen,
    nextChangesetId,
    openBlocker,
    reject,
    restoreBlocker,
    unconfirm,
    unreject,
} from "../../shared/rules.ts";
import type {
    Changeset,
    Item,
    ItemKey,
    ItemState,
    Proposal,
    RunReport,
} from "../../shared/types.ts";
import { parseKey, POST_TYPES } from "../../shared/types.ts";
import { Refusal } from "../../shared/refusal.ts";
import type { Store } from "../adapters/store.ts";
import type { WordPress } from "../adapters/wordpress.ts";
import { toSnapshot } from "../adapters/wordpress.ts";

// WordPress erroring this many articles in a row usually means the host is blocking us.
const MAX_FAILURES_IN_A_ROW = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const keyOf = (key: string) => {
    const parsed = parseKey(key);

    if (!parsed) throw new Refusal(`"${key}" is not a <posts|pages>-<id> key.`);

    return parsed;
};

const now = () => new Date().toISOString();

const requireChangeset = async (store: Store, id: string): Promise<Changeset> => {
    const changeset = await store.readChangeset(id);

    if (!changeset) throw new Refusal(`No changeset ${id}.`);

    return changeset;
};

const requireItem = async (store: Store, id: string, key: ItemKey): Promise<Item> => {
    const item = await store.readItem(id, key);

    if (!item) throw new Refusal(`${key} is not in changeset ${id}.`);

    return item;
};

const refreshStatus = async (store: Store, id: string): Promise<Changeset> => {
    const changeset = await requireChangeset(store, id);
    const status = derivedStatus(changeset, await store.readItems(id));

    if (status === changeset.status) return changeset;

    const next = { ...changeset, status };

    await store.writeChangeset(next);

    return next;
};

export const openChangeset = async (
    store: Store,
    wp: WordPress,
    options: { title: string; instructions?: string; override?: boolean; ids?: string[] },
): Promise<Changeset> => {
    const existing = await store.listChangesets();
    const blocker = openBlocker(existing, !!options.override);

    if (blocker) {
        throw new Refusal(`Changeset ${blocker.id} is still open; pass --override to abandon it.`);
    }

    const posts = options.ids
        ? await Promise.all(
              [...new Set(options.ids)]
                  .map((key) => keyOf(key))
                  .map(({ type, id }) => wp.get(type, id)),
          )
        : (await Promise.all(POST_TYPES.map((type) => wp.list(type)))).flat();

    const changeset: Changeset = {
        id: nextChangesetId(existing, options.title),
        title: options.title,
        instructions: options.instructions ?? "",
        createdAt: now(),
        status: "open",
        keys: posts.map(
            ({ type, id }) => `${type === "page" ? "pages" : "posts"}-${id}` as ItemKey,
        ),
        scanned: [],
    };

    await Promise.all(
        posts.map((post, index) =>
            store.writeBase(changeset.id, changeset.keys[index]!, toSnapshot(post)),
        ),
    );

    // Last, so a failed pull leaves the previous changeset open and no half-written one listed.
    await Promise.all(
        existing
            .filter(({ status }) => status === "open")
            .map((open) => store.writeChangeset({ ...open, status: "abandoned" })),
    );

    await store.writeChangeset(changeset);

    return changeset;
};

export const markScanned = async (store: Store, id: string, keys: string[]): Promise<Changeset> => {
    const changeset = await requireChangeset(store, id);
    const unknown = keys.filter((key) => !changeset.keys.includes(key as ItemKey));

    if (unknown.length > 0) throw new Refusal(`Not in ${id}: ${unknown.join(", ")}.`);

    await store.writeChangeset({
        ...changeset,
        scanned: [...new Set([...changeset.scanned, ...(keys as ItemKey[])])],
    });

    return refreshStatus(store, id);
};

export interface ValidateReport {
    removed: ItemKey[];
    markerWarnings: ItemKey[];
}

/** Deletes no-op proposals and lists the ones whose block markers drifted from base. */
export const validate = async (store: Store, id: string): Promise<ValidateReport> => {
    const report: ValidateReport = { removed: [], markerWarnings: [] };

    for (const item of await store.readItems(id)) {
        const { proposal, base, key } = item;

        if (!proposal) continue;

        const same =
            proposal.content === base.content &&
            (proposal.title ?? base.title) === base.title &&
            (proposal.excerpt ?? base.excerpt) === base.excerpt;

        if (same) {
            report.removed.push(key);
        } else if (markersDiffer(base.content, proposal.content)) {
            report.markerWarnings.push(key);
        }
    }

    await Promise.all(report.removed.map((key) => store.writeProposal(id, key, null)));
    await refreshStatus(store, id);

    return report;
};

const updateState = async (
    store: Store,
    id: string,
    key: ItemKey,
    change: (state: ItemState) => ItemState,
): Promise<ItemState> => {
    const state = change((await requireItem(store, id, key)).state);

    await store.writeState(id, key, state);

    return state;
};

const requirePending = async (store: Store, id: string, key: ItemKey): Promise<Item> => {
    const item = await requireItem(store, id, key);

    if (!isPending(item)) throw new Refusal(`${key} has nothing pending to review.`);

    return item;
};

const isOptionalString = (value: unknown) => value === undefined || typeof value === "string";

export const review = {
    seen: (store: Store, id: string, key: ItemKey) => updateState(store, id, key, markSeen),
    confirm: async (store: Store, id: string, key: ItemKey) => {
        await requirePending(store, id, key);

        return updateState(store, id, key, confirm);
    },
    unconfirm: async (store: Store, id: string, key: ItemKey) => {
        const { state } = await requirePending(store, id, key);

        if (state.level !== "confirmed") throw new Refusal(`${key} is not confirmed.`);

        return updateState(store, id, key, unconfirm);
    },
    reject: async (store: Store, id: string, key: ItemKey) => {
        await requirePending(store, id, key);

        const state = await updateState(store, id, key, reject);

        await refreshStatus(store, id);

        return state;
    },
    unreject: async (store: Store, id: string, key: ItemKey) => {
        const { state, proposal } = await requireItem(store, id, key);

        if (!state.rejected || !proposal) throw new Refusal(`${key} is not rejected.`);

        const changesets = await store.listChangesets();
        const other = changesets.find(
            (changeset) => changeset.status === "open" && changeset.id !== id,
        );

        // Rejecting the last pending item may have closed this changeset; undoing it reopens it.
        const reopens = !state.applied && changesets.find((c) => c.id === id)?.status === "closed";

        if (other && reopens) {
            throw new Refusal(
                `Undoing this reopens ${id}, but ${other.id} is open; finish it first.`,
            );
        }

        const next = await updateState(store, id, key, unreject);

        await refreshStatus(store, id);

        return next;
    },
    edit: async (store: Store, id: string, key: ItemKey, body: Partial<Proposal> | null) => {
        const item = await requireItem(store, id, key);

        if (!item.proposal || isApplied(item)) {
            throw new Refusal(`${key} has no editable proposal.`);
        }

        const { content, title, excerpt } = body ?? {};

        if (typeof content !== "string" || !isOptionalString(title) || !isOptionalString(excerpt)) {
            throw new Refusal("A proposal is { content, title?, excerpt? }, all strings.");
        }

        await store.writeProposal(id, key, {
            content,
            title,
            excerpt,
            reviewRequested: item.proposal.reviewRequested,
        });

        const state = await updateState(store, id, key, (current) =>
            afterEdit({ ...current, rejected: undefined }),
        );

        await refreshStatus(store, id);

        return state;
    },
};

/** Refreshes base from live WordPress and sends the item back to unreviewed. */
export const repull = async (store: Store, wp: WordPress, id: string, key: ItemKey) => {
    const { type, id: postId } = keyOf(key);
    const item = await requireItem(store, id, key);

    // A restore record is what an earlier changeset's restore checks drift against.
    if (item.state.applied) throw new Refusal("Applied items can't be re-pulled.");

    await store.writeBase(id, key, toSnapshot(await wp.get(type, postId)));
    await store.writeState(id, key, { level: "unreviewed" });
    await refreshStatus(store, id);
};

const requireWritable = async (store: Store): Promise<void> => {
    if ((await store.readSettings()).dryRun) {
        throw new Refusal("Dry-run mode is on, so nothing is written to WordPress.");
    }
};

const LANDED = "Already live in WordPress, so it was recorded without writing again.";

/**
 * Everything an apply checks before it writes, and the item it would write. `landed` is the live
 * timestamp when WordPress already holds the proposal, so the write must not be sent again.
 */
const checkApply = async (store: Store, wp: WordPress, id: string, key: ItemKey) => {
    const { type, id: postId } = keyOf(key);
    const item = await requireItem(store, id, key);

    if (!isPending(item)) throw new Refusal(`${key} has nothing to apply.`);

    const pending = item as Item & { proposal: Proposal };
    const live = await wp.get(type, postId);
    const drift = driftRefusal(expectedModified(item), live.modified_gmt);

    if (!drift) return { item: pending, landed: null };
    if (holdsText(toSnapshot(live), appliedText(pending))) {
        return { item: pending, landed: live.modified_gmt };
    }

    await store.writeState(id, key, { ...item.state, drift: true });
    throw new Refusal(drift);
};

const markerWarning = ({ base, proposal }: Item) =>
    proposal && markersDiffer(base.content, proposal.content)
        ? "Block markers differ from base."
        : null;

/** Runs every check an apply would and writes nothing to WordPress. */
export const dryRunItem = async (store: Store, wp: WordPress, id: string, key: ItemKey) => {
    const { item, landed } = await checkApply(store, wp, id, key);

    return {
        key,
        warning: landed
            ? "Already live in WordPress; Apply records it without writing again."
            : markerWarning(item),
        fingerprint: itemFingerprint(item),
    };
};

const apply = async (store: Store, wp: WordPress, id: string, key: ItemKey) => {
    await requireWritable(store);

    const { type, id: postId } = keyOf(key);
    const { item, landed } = await checkApply(store, wp, id, key);
    const modifiedGmt = landed ?? (await wp.update(type, postId, item.proposal)).modified_gmt;
    const state: ItemState = {
        ...item.state,
        drift: undefined,
        restored: undefined,
        applied: { at: now(), modifiedGmt },
    };

    await store.writeState(id, key, state);
    await refreshStatus(store, id);

    return { state, warning: landed ? LANDED : markerWarning(item) };
};

export const applyItem = async (store: Store, wp: WordPress, id: string, key: ItemKey) =>
    (await apply(store, wp, id, key)).state;

/** One article at a time, recording each outcome instead of stopping at the first failure. */
const runEach = async (
    kind: RunReport["kind"],
    items: Item[],
    step: (item: Item) => Promise<string | null>,
    save: (report: RunReport) => Promise<void>,
    pauseMs: number,
): Promise<RunReport> => {
    const report: RunReport = { kind, at: now(), ok: [], refused: [], failed: [], warnings: [] };
    const progress = (current?: ItemKey) =>
        save({ ...report, incomplete: true, total: items.length, current });
    let failuresInARow = 0;

    await progress();

    /* eslint-disable no-await-in-loop -- one article at a time, paced, stopping after a failure run */
    for (const [index, item] of items.entries()) {
        if (index > 0) await sleep(pauseMs);

        await progress(item.key);

        try {
            const warning = await step(item);

            report.ok.push(item.key);
            if (warning) report.warnings.push({ key: item.key, reason: warning });
            failuresInARow = 0;
        } catch (error) {
            const entry = { key: item.key, reason: (error as Error).message };

            if (error instanceof Refusal) {
                report.refused.push(entry);
                failuresInARow = 0;
            } else {
                report.failed.push(entry);
                failuresInARow++;
            }
        }

        if (failuresInARow === MAX_FAILURES_IN_A_ROW && index < items.length - 1) {
            report.stopped =
                `WordPress failed ${MAX_FAILURES_IN_A_ROW} articles in a row, so the ` +
                `${items.length - index - 1} after them weren't tried.`;
            break;
        }

        await progress();
    }
    /* eslint-enable no-await-in-loop */

    return report;
};

export const latestDryRun = async (store: Store, id: string): Promise<RunReport | null> =>
    (await store.listRuns(id)).find(({ kind }) => kind === "dry-run") ?? null;

/** Checks every pending article against live WordPress and saves the report bulk apply reads. */
export const bulkDryRun = async (
    store: Store,
    wp: WordPress,
    id: string,
    pauseMs?: number,
): Promise<RunReport> => {
    await requireChangeset(store, id);

    const items = await store.readItems(id);
    const settings = await store.readSettings();
    const fingerprints: Partial<Record<ItemKey, string>> = {};
    const report = await runEach(
        "dry-run",
        items.filter(isPending),
        async ({ key }) => {
            const { warning, fingerprint } = await dryRunItem(store, wp, id, key);

            fingerprints[key] = fingerprint;

            return warning;
        },
        (partial) => store.writeRun(id, { ...partial, fingerprints }),
        pauseMs ?? settings.pauseMs,
    );
    const done: RunReport = {
        ...report,
        fingerprints,
        blocker: gateBlocker(await store.readItems(id), settings),
    };

    await store.writeRun(id, done);

    return done;
};

/** One write at a time with state saved after each, so a stopped run picks up where it left off. */
export const bulkApply = async (
    store: Store,
    wp: WordPress,
    id: string,
    pauseMs?: number,
): Promise<RunReport> => {
    await requireChangeset(store, id);

    const items = await store.readItems(id);
    const settings = await store.readSettings();
    const blocker = bulkApplyBlocker(items, settings, await latestDryRun(store, id));

    if (blocker) throw new Refusal(blocker);

    const report = await runEach(
        "apply",
        items.filter(isPending),
        async ({ key }) => (await apply(store, wp, id, key)).warning,
        (partial) => store.writeRun(id, partial),
        pauseMs ?? settings.pauseMs,
    );

    await store.writeRun(id, report);

    return report;
};

/** Writes this changeset's base back, which is the article as the previous changeset left it. */
export const restoreItem = async (store: Store, wp: WordPress, id: string, key: ItemKey) => {
    const { type, id: postId } = keyOf(key);

    await requireChangeset(store, id);
    await requireWritable(store);

    const changesets = await store.listChangesets();
    const stack = await Promise.all(
        changesets.map(async (changeset) => ({
            changeset,
            item: await store.readItem(changeset.id, key),
        })),
    );
    const index = stack.findIndex(({ changeset }) => changeset.id === id);
    const own = stack[index]?.item;
    const live = await wp.get(type, postId);
    const landed = !!own && holdsText(toSnapshot(live), own.base);
    const blocker = restoreBlocker(stack, index, live.modified_gmt, landed);

    if (blocker) throw new Refusal(blocker);

    const { base, state } = own!;
    const modifiedGmt = landed
        ? live.modified_gmt
        : (await wp.update(type, postId, base)).modified_gmt;
    // Back in review, so sending it out again takes a fresh confirm.
    const next: ItemState = { ...state, level: "seen", restored: { at: now(), modifiedGmt } };

    await store.writeState(id, key, next);

    return next;
};

/** Restores every applied article, so a stopped run resumes with only the ones still live. */
export const bulkRestore = async (
    store: Store,
    wp: WordPress,
    id: string,
    pauseMs?: number,
): Promise<RunReport> => {
    await requireChangeset(store, id);

    const items = await store.readItems(id);
    const settings = await store.readSettings();
    const blocker = bulkRestoreBlocker(items, settings);

    if (blocker) throw new Refusal(blocker);

    const report = await runEach(
        "restore",
        items.filter(isApplied),
        async ({ key }) => {
            await restoreItem(store, wp, id, key);

            return null;
        },
        (partial) => store.writeRun(id, partial),
        pauseMs ?? settings.pauseMs,
    );

    await store.writeRun(id, report);

    return report;
};
