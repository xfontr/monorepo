import type { InterestInput } from "./InterestInput";
import type { InterestResult } from "./InterestResult";

/** A calculation kept in the history table. */
export interface InterestEntry extends InterestInput, InterestResult {
    id: string;
    concept: string;
}
