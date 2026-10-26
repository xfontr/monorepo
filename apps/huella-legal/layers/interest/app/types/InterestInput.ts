export interface InterestInput {
    /** Euros, up to two decimals. */
    principal: number;
    /** Annual, as a percentage: `3.25` is 3.25 %. */
    ratePercent: number;
    /** ISO dates (`YYYY-MM-DD`). */
    from: string;
    to: string;
}
