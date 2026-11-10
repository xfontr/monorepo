import type { DecisionOutcome, DecisionStatus } from "#layers/snapshot/shared/types.ts";
import type { Tone } from "~/utils/format.ts";

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
