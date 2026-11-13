/** Below this share of its scale's busiest cell, a count would vanish into the empty-cell grey. */
const FLOOR = 25;

/** A base line on a day with a failed run, so the failure never rides on the cell's hue alone. */
export const FAILED_MARK = "inset 0 -3px 0 var(--tone-bad)";

/** A CSS colour for `count` on a one-hue scale whose darkest step is `busiest`; `undefined` for zero. */
export const heatColor = (token: string, count: number, busiest: number): string | undefined => {
    if (count <= 0) return undefined;

    const share = Math.round(FLOOR + (100 - FLOOR) * Math.min(1, count / Math.max(1, busiest)));

    return `color-mix(in oklab, var(${token}) ${share}%, transparent)`;
};

/** A whole percentage, 0 when there is nothing to divide. */
export const percentOf = (part: number, whole: number): number =>
    whole === 0 ? 0 : Math.round((part / whole) * 100);
