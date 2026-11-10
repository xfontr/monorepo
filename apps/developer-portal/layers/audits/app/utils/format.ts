import type { AuditState, FindingStatus } from "#layers/snapshot/shared/audits.ts";
import type { Tone } from "~/utils/format.ts";

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
