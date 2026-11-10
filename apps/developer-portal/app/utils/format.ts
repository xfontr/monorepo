import type { AuditState, FindingStatus } from "#shared/audits.ts";
import type { CapabilityState, Kind, ReusePlan, TicketStatus } from "#shared/workflows.ts";
import type { DecisionOutcome, DecisionStatus } from "#shared/types.ts";

/** The palette behind these three classes lives in `assets/css/main.css` and is shown beside the figure it describes, never instead of it. */
export type Tone = "good" | "warn" | "bad" | "neutral";

/** The one threshold pair in the app, so the overview tile and the coverage table cannot disagree. */
export const coverageTone = (pct: number | null | undefined): Tone => {
    if (pct === null || pct === undefined) return "neutral";
    if (pct >= 80) return "good";
    if (pct >= 60) return "warn";

    return "bad";
};

/** SCORECARDS.md's own scale: 4-5 is sound or better, 3 is mixed, 1-2 is costing something now. */
export const scoreTone = (score: number | null | undefined): Tone => {
    if (score === null || score === undefined) return "neutral";
    if (score >= 4) return "good";
    if (score >= 3) return "warn";

    return "bad";
};

/** `pnpm audit`'s own five-band scale, collapsed to the app's three tones. */
export const severityTone = (severity: "info" | "low" | "moderate" | "high" | "critical"): Tone => {
    if (severity === "critical" || severity === "high") return "bad";
    if (severity === "moderate") return "warn";

    return "neutral";
};

const KIND_ICONS: Record<string, string> = {
    readme: "i-lucide-file-text",
    agent: "i-lucide-bot",
    changelog: "i-lucide-tag",
    skill: "i-lucide-wand-sparkles",
    doc: "i-lucide-book-open",
    review: "i-lucide-clipboard-check",
    decision: "i-lucide-compass",
    audit: "i-lucide-scan-search",
};

export const kindIcon = (kind: string): string => KIND_ICONS[kind] ?? "i-lucide-file-text";

const DECISION_STATUS_LABELS = {
    "to-implement": "To implement",
    implemented: "Implemented",
    "wont-implement": "Won't implement",
} as const satisfies Record<DecisionStatus, string>;

export const decisionStatusLabel = (status: DecisionStatus): string =>
    DECISION_STATUS_LABELS[status];

/** Reuses the same validated three-tone palette everything else on this page uses for a verdict. */
const DECISION_STATUS_TONES = {
    "to-implement": "warn",
    implemented: "good",
    "wont-implement": "neutral",
} as const satisfies Record<DecisionStatus, Tone>;

export const decisionStatusTone = (status: DecisionStatus): Tone => DECISION_STATUS_TONES[status];

const DECISION_OUTCOME_LABELS = {
    accepted: "Accepted",
    superseded: "Superseded",
} as const satisfies Record<DecisionOutcome, string>;

export const decisionOutcomeLabel = (decision: DecisionOutcome): string =>
    DECISION_OUTCOME_LABELS[decision];

const FINDING_STATUS_LABELS = {
    open: "Open",
    fixed: "Fixed",
    "wont-fix": "Won't fix",
} as const satisfies Record<FindingStatus, string>;

export const findingStatusLabel = (status: FindingStatus): string => FINDING_STATUS_LABELS[status];

const FINDING_STATUS_TONES = {
    open: "warn",
    fixed: "good",
    "wont-fix": "neutral",
} as const satisfies Record<FindingStatus, Tone>;

export const findingStatusTone = (status: FindingStatus): Tone => FINDING_STATUS_TONES[status];

const AUDIT_STATE_LABELS = {
    open: "Open",
    "in-progress": "In progress",
    closed: "Closed",
} as const satisfies Record<AuditState, string>;

export const auditStateLabel = (state: AuditState): string => AUDIT_STATE_LABELS[state];

const AUDIT_STATE_TONES = {
    open: "warn",
    "in-progress": "warn",
    closed: "good",
} as const satisfies Record<AuditState, Tone>;

export const auditStateTone = (state: AuditState): Tone => AUDIT_STATE_TONES[state];

/** One hue per state, shared by blocks and tickets; each reads on both themes. */
const STATE_COLORS = {
    "waiting-on-you": "#8b5cf6",
    ready: "#0ea5e9",
    "in-flight": "#f59e0b",
    blocked: "#64748b",
    "can-file": "#14b8a6",
    waits: "#94a3b8",
    done: "var(--tone-good)",
    dropped: "var(--ui-text-dimmed)",
    skipped: "var(--ui-text-dimmed)",
    off: "var(--ui-text-dimmed)",
} as const satisfies Record<CapabilityState | TicketStatus, string>;

const CAPABILITY_STATES = {
    off: { label: "Off", tone: "neutral" },
    skipped: { label: "Skipped", tone: "neutral" },
    waits: { label: "Waits on a decision", tone: "neutral" },
    "can-file": { label: "Can file now", tone: "neutral" },
    blocked: { label: "Blocked", tone: "neutral" },
    "waiting-on-you": { label: "Waiting on you", tone: "warn" },
    ready: { label: "Ready", tone: "neutral" },
    "in-flight": { label: "In flight", tone: "warn" },
    done: { label: "Done", tone: "good" },
} as const satisfies Record<CapabilityState, { label: string; tone: Tone }>;

export const capabilityStateLabel = (state: CapabilityState): string =>
    CAPABILITY_STATES[state].label;

export const capabilityStateTone = (state: CapabilityState): Tone => CAPABILITY_STATES[state].tone;

const TICKET_STATUSES = {
    "waiting-on-you": { label: "Waiting on you", tone: "warn" },
    ready: { label: "Ready", tone: "neutral" },
    "in-flight": { label: "In flight", tone: "warn" },
    blocked: { label: "Blocked", tone: "neutral" },
    done: { label: "Done", tone: "good" },
    dropped: { label: "Dropped", tone: "neutral" },
} as const satisfies Record<TicketStatus, { label: string; tone: Tone }>;

export const ticketStatusLabel = (status: TicketStatus): string => TICKET_STATUSES[status].label;

export const ticketStatusTone = (status: TicketStatus): Tone => TICKET_STATUSES[status].tone;

export const stateColor = (state: CapabilityState | TicketStatus): string => STATE_COLORS[state];

const BLOCK_KINDS = {
    build: { label: "Build", icon: null },
    spike: { label: "Spike — answers a question", icon: "i-lucide-flask-conical" },
    owner: { label: "Yours — only you can close it", icon: "i-lucide-user-round" },
} as const satisfies Record<Kind, { label: string; icon: string | null }>;

export const blockKindLabel = (kind: Kind): string => BLOCK_KINDS[kind].label;

export const blockKindIcon = (kind: Kind): string | null => BLOCK_KINDS[kind].icon;

/** OKLCH hues, one per stage; decoration only, so a stage is never told apart by its hue alone. */
const STAGE_HUES = [5, 50, 95, 160, 235, 275, 315] as const;

export const stageColor = (index: number): string =>
    `oklch(0.72 0.18 ${STAGE_HUES[index % STAGE_HUES.length]})`;

export const capabilityColor = (state: CapabilityState): string => STATE_COLORS[state];

/** Hollow for a block nobody can work on yet, so its state survives without its colour. */
export const capabilityFilled = (state: CapabilityState): boolean =>
    ["done", "in-flight", "ready", "waiting-on-you", "skipped"].includes(state);

const REUSE_PLAN_LABELS = {
    package: "Import the package",
    extract: "Extract to a package",
    copy: "Copy and adapt",
    method: "Follow the method",
    new: "Build new",
} as const satisfies Record<ReusePlan, string>;

export const reusePlanLabel = (plan: ReusePlan): string => REUSE_PLAN_LABELS[plan];

export const progressTone = (percent: number): Tone => {
    if (percent >= 100) return "good";
    if (percent >= 50) return "warn";

    return "neutral";
};

/** A `YYYY-MM-DD` calendar day as "6 Oct", read in UTC so the server and the browser agree. */
export const calendarDay = (day: string, month: "short" | "only" = "short"): string =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString(
        "en-GB",
        month === "only"
            ? { timeZone: "UTC", month: "short" }
            : { timeZone: "UTC", day: "numeric", month: "short" },
    );

/** "3 hours ago" beats a timestamp for the one question a report page has to answer. */
export const relativeTime = (iso: string | null | undefined): string => {
    if (!iso) return "never";

    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

    const smallest = { unit: "second" as Intl.RelativeTimeFormatUnit, size: 1 };

    const scale = [
        smallest,
        { unit: "minute" as Intl.RelativeTimeFormatUnit, size: 60 },
        { unit: "hour" as Intl.RelativeTimeFormatUnit, size: 3600 },
        { unit: "day" as Intl.RelativeTimeFormatUnit, size: 86_400 },
        { unit: "month" as Intl.RelativeTimeFormatUnit, size: 2_592_000 },
        { unit: "year" as Intl.RelativeTimeFormatUnit, size: 31_536_000 },
    ];

    // The largest unit the gap fills at least once — "3 hours ago", never "180 minutes ago".
    const step = scale.findLast((entry) => Math.abs(seconds) >= entry.size) ?? smallest;

    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        -Math.round(seconds / step.size),
        step.unit,
    );
};
