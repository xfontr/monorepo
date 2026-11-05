import { Refusal } from "./refusal.ts";
import type {
    Changeset,
    Item,
    ItemState,
    Proposal,
    ReviewLevel,
    RunReport,
    Settings,
    Snapshot,
} from "./types.ts";
import { DEFAULT_SETTINGS, MAX_PAUSE_MS, REVIEW_GATES } from "./types.ts";

const RANK = { unreviewed: 0, seen: 1, confirmed: 2 } as const satisfies Record<
    ReviewLevel,
    number
>;

export const slugify = (title: string): string =>
    title
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "changeset";

export const nextChangesetId = (existing: Changeset[], title: string): string => {
    const last = Math.max(0, ...existing.map(({ id }) => Number.parseInt(id, 10) || 0));

    return `${String(last + 1).padStart(4, "0")}-${slugify(title)}`;
};

/** Returns the open changeset that blocks a new one, or null when a new one may open. */
export const openBlocker = (existing: Changeset[], override: boolean): Changeset | null =>
    override ? null : (existing.find(({ status }) => status === "open") ?? null);

/** Has a proposal that is neither rejected nor live; a restored article is pending again. */
export const isPending = ({ proposal, state }: Pick<Item, "proposal" | "state">): boolean =>
    proposal !== null && !state.rejected && !(state.applied && !state.restored);

export const isApplied = ({ state }: Pick<Item, "state">): boolean =>
    !!state.applied && !state.restored;

/** The live `modified_gmt` if nothing but this tool wrote the article since the pull. */
export const expectedModified = ({ base, state }: Pick<Item, "base" | "state">): string =>
    state.restored?.modifiedGmt ?? base.modifiedGmt;

/** Open until every key is scanned and every proposal is applied or rejected. */
export const derivedStatus = (changeset: Changeset, items: Item[]): Changeset["status"] => {
    if (changeset.status === "abandoned") return "abandoned";

    const scanned = new Set(changeset.scanned);
    // A restore never reopens a changeset, or restoring through the stack would open a second one.
    const waiting = items.some((item) => isPending(item) && !item.state.applied);
    const done = changeset.keys.every((key) => scanned.has(key)) && !waiting;

    return done ? "closed" : "open";
};

export const markSeen = (state: ItemState): ItemState =>
    state.level === "unreviewed" ? { ...state, level: "seen" } : state;

export const confirm = (state: ItemState): ItemState => ({ ...state, level: "confirmed" });

export const unconfirm = (state: ItemState): ItemState => ({ ...state, level: "seen" });

export const afterEdit = (state: ItemState): ItemState => ({ ...state, level: "seen" });

export const reject = (state: ItemState): ItemState => ({ ...state, rejected: true });

export const unreject = (state: ItemState): ItemState => ({ ...state, rejected: undefined });

export const isReviewRequested = ({ proposal }: Pick<Item, "proposal">): boolean =>
    !!proposal?.reviewRequested;

/** Why an empty queue, the review gate or drift keeps bulk apply shut, or null when none do. */
export const gateBlocker = (
    items: Item[],
    { reviewGate, bulkApplyMinLevel }: Settings,
): string | null => {
    const pending = items.filter(isPending);

    if (pending.length === 0) return "Nothing left to apply.";

    const gated = reviewGate === "requested" ? pending.filter(isReviewRequested) : pending;
    const short =
        reviewGate === "none"
            ? []
            : gated.filter(({ state }) => RANK[state.level] < RANK[bulkApplyMinLevel]);

    if (short.length > 0) {
        const scope = reviewGate === "requested" ? "review-requested" : "pending";

        return `${short.length} of ${gated.length} ${scope} articles are not yet ${bulkApplyMinLevel}.`;
    }

    const drifted = pending.filter(({ state }) => state.drift).length;

    return drifted > 0
        ? `${drifted} articles changed in WordPress since pull; re-pull them.`
        : null;
};

// FNV-1a: only compared for equality, never secret, and the app bundle can't use node:crypto.
const hash = (text: string): string => {
    let value = 0x811c9dc5;

    for (let index = 0; index < text.length; index++) {
        value = Math.imul(value ^ text.charCodeAt(index), 0x01000193);
    }

    return (value >>> 0).toString(16).padStart(8, "0");
};

/** Changes whenever what an apply would write, or the timestamp it checks drift against, changes. */
export const itemFingerprint = (item: Pick<Item, "base" | "state" | "proposal">): string => {
    const { content = "", title = "", excerpt = "" } = item.proposal ?? {};

    return hash([expectedModified(item), content, title, excerpt].join("\0"));
};

/** Why the last dry run doesn't cover the pending articles, or null when it does. */
export const dryRunBlocker = (items: Item[], lastDryRun: RunReport | null): string | null => {
    if (!lastDryRun) return "Run a dry run first.";
    if (lastDryRun.incomplete) return "The last dry run didn't finish; run it again.";

    const unchecked = items
        .filter(isPending)
        .filter((item) => lastDryRun.fingerprints?.[item.key] !== itemFingerprint(item)).length;

    return unchecked > 0
        ? `${unchecked} pending articles weren't cleared by the last dry run; run it again.`
        : null;
};

/** Why bulk apply is disabled, or null when it may run. */
export const bulkApplyBlocker = (
    items: Item[],
    settings: Settings,
    lastDryRun: RunReport | null,
): string | null => {
    if (settings.dryRun) return "Dry-run mode is on, so nothing is written to WordPress.";

    return (
        gateBlocker(items, settings) ??
        (settings.requireDryRun ? dryRunBlocker(items, lastDryRun) : null)
    );
};

/** Why restore-all is disabled, or null when it may run. */
export const bulkRestoreBlocker = (items: Item[], settings: Settings): string | null => {
    if (settings.dryRun) return "Dry-run mode is on, so nothing is written to WordPress.";

    return items.some(isApplied) ? null : "Nothing is applied, so there is nothing to restore.";
};

type Text = Pick<Snapshot, "content" | "title" | "excerpt">;

/** What WordPress holds once `item` is applied; a title or excerpt it leaves out stays as it was. */
export const appliedText = ({
    base,
    proposal,
}: Pick<Item, "base"> & { proposal: Proposal }): Text => ({
    content: proposal.content,
    title: proposal.title ?? base.title,
    excerpt: proposal.excerpt ?? base.excerpt,
});

/** Whether WordPress already holds `text`, as when a write landed but its response never came back. */
export const holdsText = (live: Text, text: Text): boolean =>
    live.content === text.content && live.title === text.title && live.excerpt === text.excerpt;

/** Merges a settings patch over `current`, refusing any field with an unknown value. */
export const parseSettings = (patch: unknown, current: Settings = DEFAULT_SETTINGS): Settings => {
    const next = { ...current, ...(patch as Partial<Settings> | null) };
    const valid =
        REVIEW_GATES.includes(next.reviewGate) &&
        (next.bulkApplyMinLevel === "seen" || next.bulkApplyMinLevel === "confirmed") &&
        typeof next.requireDryRun === "boolean" &&
        typeof next.dryRun === "boolean" &&
        Number.isInteger(next.pauseMs) &&
        next.pauseMs >= 0 &&
        next.pauseMs <= MAX_PAUSE_MS;

    if (!valid) {
        throw new Refusal(
            `Settings are reviewGate ${REVIEW_GATES.join("|")}, bulkApplyMinLevel seen|confirmed, ` +
                `requireDryRun and dryRun booleans, pauseMs a whole number from 0 to ${MAX_PAUSE_MS}.`,
        );
    }

    const { reviewGate, bulkApplyMinLevel, requireDryRun, dryRun, pauseMs } = next;

    return { reviewGate, bulkApplyMinLevel, requireDryRun, dryRun, pauseMs };
};

/** Why a write is refused because WordPress moved since `expected`, or null when it may go ahead. */
export const driftRefusal = (expected: string, live: string): string | null =>
    expected === live ? null : "Changed in WordPress since pull, re-pull.";

export interface StackEntry {
    changeset: Changeset;
    item: Item | undefined;
}

/**
 * Why `item` of the changeset at `stack[index]` can't be restored, or null when it can.
 * `stack` is every changeset in creation order, each with its copy of the same key. `landed` is
 * true when WordPress already holds this changeset's base, so its timestamp can't count as drift.
 */
export const restoreBlocker = (
    stack: StackEntry[],
    index: number,
    live: string,
    landed = false,
): string | null => {
    const own = stack[index]?.item;

    if (!own || !isApplied(own)) return "Not applied, so there is nothing to restore.";

    const later = stack.slice(index + 1).find(({ item }) => item && isApplied(item));

    if (later) return `Restore it in changeset ${later.changeset.id} first; it is applied there.`;
    if (landed) return null;

    // A later changeset's restore is the tool's own write, so it moves the expected timestamp too.
    const writes = [
        own.state.applied!,
        ...stack.slice(index + 1).map(({ item }) => item?.state.restored),
    ];
    const last = writes
        .filter((write) => write !== undefined)
        .sort((a, b) => a.at.localeCompare(b.at))
        .at(-1)!;

    return last.modifiedGmt === live
        ? null
        : "Changed in WordPress since it was applied; restoring would overwrite that.";
};
