import * as v from "valibot";

/** A history row as read back from storage, which the reader's browser can hold in any shape. */
export const interestEntrySchema = v.object({
    id: v.string(),
    concept: v.string(),
    principal: v.number(),
    ratePercent: v.number(),
    from: v.pipe(v.string(), v.isoDate()),
    to: v.pipe(v.string(), v.isoDate()),
    days: v.number(),
    interestCents: v.number(),
    totalCents: v.number(),
});
