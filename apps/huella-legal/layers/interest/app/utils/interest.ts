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

const EARLIEST_YEAR = 1900;
const LATEST_YEAR = 2100;

/** The ISO date for a day, month and year typed apart, or `undefined` when that day doesn't exist. */
export const calendarDate = (day: number, month: number, year: number): string | undefined => {
    if (![day, month, year].every(Number.isInteger)) return undefined;
    if (year < EARLIEST_YEAR || year > LATEST_YEAR) return undefined;

    const date = new Date(Date.UTC(year, month - 1, day));

    // Date.UTC rolls 31 February over into March, so a date that doesn't exist comes back changed
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;

    return date.toISOString().slice(0, 10);
};

const GROUPED = /^\d{1,3}(?:\.\d{3})+$/;
const GROUPED_WITH_COMMA = /^\d{1,3}(?:\.\d{3})*(?:,\d+)?$/;
const PLAIN = /^\d+(?:[.,]\d+)?$/;

/**
 * A number as a Spanish reader types it, or `undefined` when it isn't one. With `grouping`, a dot
 * before three digits groups thousands, so `1.000` is a thousand, as it is in Spain.
 */
export const parseDecimal = (
    text: string,
    { grouping }: { grouping: boolean },
): number | undefined => {
    const compact = text.replace(/[\s€%]/g, "");

    if (
        grouping &&
        (GROUPED.test(compact) || (compact.includes(",") && GROUPED_WITH_COMMA.test(compact)))
    ) {
        return Number(compact.replaceAll(".", "").replace(",", "."));
    }

    return PLAIN.test(compact) ? Number(compact.replace(",", ".")) : undefined;
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
    if (Number.isNaN(principal) || principal <= 0) {
        throw new RangeError("The principal must be positive");
    }
    if (Number.isNaN(ratePercent) || ratePercent <= 0) {
        throw new RangeError("The rate must be positive");
    }

    const days = daysBetween(from, to);
    const principalCents = Math.round(principal * 100);
    const interestCents = Math.round((principalCents * ratePercent * days) / (100 * DAYS_PER_YEAR));

    return { days, interestCents, totalCents: principalCents + interestCents };
};
