export const POST_TYPES = ["posts", "pages"] as const;
export type PostType = (typeof POST_TYPES)[number];

/** `<type>-<id>`, so posts and pages share one model. */
export type ItemKey = `${PostType}-${number}`;

export const REVIEW_LEVELS = ["unreviewed", "seen", "confirmed"] as const;
export type ReviewLevel = (typeof REVIEW_LEVELS)[number];

export type ChangesetStatus = "open" | "closed" | "abandoned";

export interface Changeset {
    id: string;
    title: string;
    instructions: string;
    createdAt: string;
    status: ChangesetStatus;
    keys: ItemKey[];
    scanned: ItemKey[];
}

/** The article as WordPress had it at pull time; `content` is `content.raw`. */
export interface Snapshot {
    title: string;
    excerpt: string;
    content: string;
    modifiedGmt: string;
}

export interface BaseMeta {
    modifiedGmt: string;
    date: string;
    status: string;
    author: string;
    image: string | null;
    link: string;
    title: string;
    excerpt: string;
}

export interface Proposal {
    content: string;
    title?: string;
    excerpt?: string;
    /** Set by the change-maker: why a human should double-check this one. Never sent to WordPress. */
    reviewRequested?: string;
}

export interface ItemState {
    level: ReviewLevel;
    rejected?: boolean;
    drift?: boolean;
    applied?: { at: string; modifiedGmt: string };
    restored?: { at: string; modifiedGmt: string };
}

export interface Item {
    key: ItemKey;
    base: Snapshot & BaseMeta;
    proposal: Proposal | null;
    state: ItemState;
}

export interface RunEntry {
    key: ItemKey;
    reason: string;
}

/** One bulk run, kept in the changeset so what happened can be read back later. */
export interface RunReport {
    kind: "apply" | "dry-run";
    at: string;
    /** Applied, or for a dry run, would apply. */
    ok: ItemKey[];
    /** A rule said no, such as drift. */
    refused: RunEntry[];
    /** WordPress or the network errored. */
    failed: RunEntry[];
    /** Went through, but the block markers differ from base. */
    warnings: RunEntry[];
    /** Dry run only: what would still keep bulk apply shut, besides the dry run itself. */
    blocker?: string | null;
    /** Dry run only: what each `ok` article looked like, so a later edit invalidates the run. */
    fingerprints?: Partial<Record<ItemKey, string>>;
}

export const REVIEW_GATES = ["all", "requested", "none"] as const;
/** Which pending articles must reach `bulkApplyMinLevel` before bulk apply. */
export type ReviewGate = (typeof REVIEW_GATES)[number];

export interface Settings {
    reviewGate: ReviewGate;
    bulkApplyMinLevel: Exclude<ReviewLevel, "unreviewed">;
    /** Bulk apply needs a clean dry run of exactly what it is about to write. */
    requireDryRun: boolean;
    /** Every WordPress write is refused; Apply and Bulk apply only check. */
    dryRun: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    reviewGate: "all",
    bulkApplyMinLevel: "confirmed",
    requireDryRun: false,
    dryRun: false,
};

export const parseKey = (key: string): { type: PostType; id: number } | null => {
    const match = /^(posts|pages)-(\d+)$/.exec(key);

    return match ? { type: match[1] as PostType, id: Number(match[2]) } : null;
};
