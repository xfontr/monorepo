import type { Capability, Points } from "./types.ts";

/** The template's estimates summed over these blocks; a block without one adds nothing. */
export const complexityOf = (capabilities: Capability[]): number =>
    capabilities.reduce((sum, { complexity }) => sum + (complexity ?? 0), 0);

/** A shared ticket splits its points between blocks, so a share keeps one decimal to still add up. */
export const formatPoints = (value: number): string =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);

export const pointsLine = ({ done, total, estimated, unestimated }: Points): string =>
    [
        `${formatPoints(done)} of ${formatPoints(total)} SP done`,
        estimated > 0 ? `${formatPoints(estimated)} still template estimates` : "",
        unestimated > 0 ? `${unestimated} unestimated` : "",
    ]
        .filter(Boolean)
        .join(" · ");
