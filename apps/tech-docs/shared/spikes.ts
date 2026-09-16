/** The vocabulary `docs/spikes/README.md` documents, as the one copy every other spelling of it derives from. */
export const SPIKE_STATUSES = ["to-implement", "implemented", "wont-implement"] as const;
export const SPIKE_DECISIONS = ["accepted", "superseded"] as const;

export type SpikeStatus = typeof SPIKE_STATUSES[number];
export type SpikeDecision = typeof SPIKE_DECISIONS[number];
