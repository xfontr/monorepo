/** The vocabulary `docs/decisions/README.md` documents, as the one copy every other spelling of it derives from. */
export const DECISION_STATUSES = ["to-implement", "implemented", "wont-implement"] as const;
export const DECISION_OUTCOMES = ["accepted", "superseded"] as const;

export type DecisionStatus = typeof DECISION_STATUSES[number];
export type DecisionOutcome = typeof DECISION_OUTCOMES[number];
