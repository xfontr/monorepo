import type { InterestInput } from "../types/InterestInput";
import type { InterestRate } from "../types/InterestRate";
import type { InterestResult } from "../types/InterestResult";

// Ley 31/2022 (DA 42.ª) sets the legal rate, carried by budget extensions until a new budget law;
// LEC art. 576 makes judicial interest that rate plus two points
export const INTEREST_RATES = { legal: 3.25, judicial: 5.25 } as const satisfies Record<
    Exclude<InterestRate, "custom">,
    number
>;

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365;

const toUtc = (iso: string): number => {
    const time = Date.parse(`${iso}T00:00:00Z`);

    if (Number.isNaN(time)) throw new RangeError(`Not an ISO date: ${iso}`);

    return time;
};

export const daysBetween = (from: string, to: string): number => {
    const days = Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);

    if (days < 0) throw new RangeError("The end date is before the start date");

    return days;
};

/** Simple (non-compounding) interest, actual days over a 365-day year, in euro cents. */
export const calculateInterest = ({
    principal,
    ratePercent,
    from,
    to,
}: InterestInput): InterestResult => {
    if (!(principal > 0)) throw new RangeError("The principal must be positive");
    if (!(ratePercent > 0)) throw new RangeError("The rate must be positive");

    const days = daysBetween(from, to);
    const principalCents = Math.round(principal * 100);
    const interestCents = Math.round((principalCents * ratePercent * days) / (100 * DAYS_PER_YEAR));

    return { days, interestCents, totalCents: principalCents + interestCents };
};
