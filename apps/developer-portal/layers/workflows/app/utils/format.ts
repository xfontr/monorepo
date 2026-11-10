import type {
    CapabilityState,
    Kind,
    ReusePlan,
    TicketStatus,
} from "#layers/workflows/shared/workflows.ts";
import type { Tone } from "~/utils/format.ts";

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

/** One `--state-*` token per state in `workflows.css`, shared by blocks and tickets. */
export const stateColor = (state: CapabilityState | TicketStatus): string =>
    `var(--state-${state})`;

const BLOCK_KINDS = {
    build: { label: "Build", icon: null },
    spike: { label: "Spike — answers a question", icon: "i-lucide-flask-conical" },
    owner: { label: "Yours — only you can close it", icon: "i-lucide-user-round" },
} as const satisfies Record<Kind, { label: string; icon: string | null }>;

export const blockKindLabel = (kind: Kind): string => BLOCK_KINDS[kind].label;

export const blockKindIcon = (kind: Kind): string | null => BLOCK_KINDS[kind].icon;

/** How many `--stage-*` tokens `workflows.css` defines; a longer template wraps round. */
const STAGE_COLORS = 7;

export const stageColor = (index: number): string => `var(--stage-${(index % STAGE_COLORS) + 1})`;

export const capabilityColor = (state: CapabilityState): string => stateColor(state);

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
