import type { Capability, Points } from "./types.ts";

/** The template's estimates summed over these blocks; a block without one adds nothing. */
export const complexityOf = (capabilities: Capability[]): number =>
    capabilities.reduce((sum, { complexity }) => sum + (complexity ?? 0), 0);

/** A shared ticket splits its points between blocks, so a block's share can be fractional. */
const whole = (value: number): number => Math.round(value);

export const pointsLine = ({ done, total, estimated, unestimated }: Points): string =>
    [
        `${whole(done)} of ${whole(total)} SP done`,
        estimated > 0 ? `${whole(estimated)} still template estimates` : "",
        unestimated > 0 ? `${unestimated} unestimated` : "",
    ]
        .filter(Boolean)
        .join(" · ");
