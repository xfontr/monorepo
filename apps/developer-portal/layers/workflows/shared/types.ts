/** The vocabularies `docs/workflows/README.md` documents, as the one copy every other spelling derives from. */
export const REUSE_PLANS = ["package", "extract", "copy", "method", "new"] as const;
export const KINDS = ["build", "spike", "owner"] as const;
export const SETTLED_STATES = ["done", "skipped"] as const;
export const CAPABILITY_STATES = [
    "off",
    "skipped",
    "waits",
    "can-file",
    "blocked",
    "waiting-on-you",
    "ready",
    "in-flight",
    "done",
] as const;
export const TICKET_STATUSES = [
    "waiting-on-you",
    "ready",
    "in-flight",
    "blocked",
    "done",
    "dropped",
] as const;

export type ReusePlan = (typeof REUSE_PLANS)[number];
export type Kind = (typeof KINDS)[number];
export type SettledState = (typeof SETTLED_STATES)[number];
export type CapabilityState = (typeof CAPABILITY_STATES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** The prefix of the GitHub label that places an issue under a capability. */
export const CAPABILITY_LABEL_PREFIX = "cap:";

/** The GitHub label on a ticket only the project's owner can close: a decision, a credential, DNS. */
export const OWNER_LABEL = "owner";

export interface Lesson {
    text: string;
    issues: number[];
}

export interface SuggestedTicket {
    title: string;
    criteria: string[];
}

export interface Capability {
    id: string;
    stage: string;
    /** A group switches every capability in it off at once, across stages. */
    group: string | null;
    title: string;
    summary: string;
    kind: Kind;
    optional: boolean;
    /** Whether an optional capability starts switched on; always true for a required one. */
    default: boolean;
    dependsOn: string[];
    doneWhen: string[];
    reuse: { plan: ReusePlan; from: string | null } | null;
    lessons: Lesson[];
    tickets: SuggestedTicket[];
}

/** A switchable bundle of capabilities, such as a blog, with no tickets or progress of its own. */
export interface Group {
    id: string;
    title: string;
    summary: string;
    optional: boolean;
    default: boolean;
}

export interface Stage {
    id: string;
    title: string;
    goal: string;
}

export interface Template {
    id: string;
    title: string;
    summary: string;
    stages: Stage[];
    groups: Group[];
    capabilities: Capability[];
}

export interface Project {
    id: string;
    title: string;
    template: string;
    area: string;
    milestone: string;
    summary: string;
    switches: Record<string, boolean>;
    /** `on` is the day it was settled, so a replay of an earlier day doesn't count it yet. */
    settled: Record<string, { status: SettledState; note: string; on: string | null }>;
    extras: Capability[];
}

export interface SnapshotIssue {
    number: number;
    title: string;
    url: string;
    state: "open" | "closed";
    /** GitHub's `state_reason`, so a ticket closed as not planned doesn't count as delivered. */
    reason: "completed" | "not_planned" | null;
    caps: string[];
    /** Null in a snapshot synced before it was recorded, which a replay treats as always filed. */
    createdAt: string | null;
    closedAt: string | null;
    /** The author date of every commit tagged `[#N]` for this issue, ascending. */
    activity: string[];
    /** GitHub's blocked-by links with each blocker's state and close date, since a blocker can sit outside the milestone. */
    blockedBy: { number: number; open: boolean; closedAt: string | null }[];
    /** A branch is linked on the issue, which is how `pnpm issue:pick` marks it as taken. */
    branch: boolean;
    owner: boolean;
}

export interface Snapshot {
    syncedAt: string;
    milestone: string;
    issues: SnapshotIssue[];
    /** Open issues with the project's area label and no milestone, typically filed by hand. */
    noMilestone: SnapshotIssue[];
}

export interface WorkflowProblem {
    file: string;
    message: string;
}

export interface CapabilityView extends Capability {
    state: CapabilityState;
    enabled: boolean;
    extra: boolean;
    note: string | null;
    /** Its tickets as of the day viewed: filed by then, with their state on that day. */
    issues: SnapshotIssue[];
    /** What it needs once switched-off blocks are taken out: their own needs take their place. */
    needs: string[];
    /** The blocks that need it, after the same re-routing. */
    unblocks: string[];
    /** The needs that aren't finished, which is why it is blocked or can't be filed yet. */
    waitingOn: string[];
    /** Unfinished blocks behind it, directly or through others. */
    unblockCount: number;
}

export interface StageView extends Stage {
    capabilities: CapabilityView[];
    progress: Progress;
}

export interface Progress {
    done: number;
    total: number;
    percent: number;
}

export interface UnsortedIssue {
    issue: SnapshotIssue;
    reason: string;
}

/** One switch in a project's plan: a group of blocks such as a blog, or a single optional block. */
export interface Feature {
    id: string;
    title: string;
    summary: string;
    enabled: boolean;
    /** Titles of the blocks it brings in. */
    blocks: string[];
    /** The feature it sits inside, which has to be on for this one to be. */
    within: string | null;
}

export interface ProjectView {
    project: Project;
    template: Template;
    /** Kept so the page can lay the same project over another day. */
    snapshot: Snapshot | null;
    /** The day viewed, or null for the snapshot as synced. */
    asOf: string | null;
    features: Feature[];
    stages: StageView[];
    capabilities: CapabilityView[];
    /** Every unfinished block, what needs the owner first, then most-unblocking first. */
    left: CapabilityView[];
    counts: Record<CapabilityState, number>;
    /** The longest chain of unfinished blocks, which decides when the project can finish. */
    critical: string[];
    unsorted: UnsortedIssue[];
    progress: Progress;
    syncedAt: string | null;
}
