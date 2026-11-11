export type Tone = "good" | "warn" | "bad" | "neutral";

const TONE_CLASSES = {
    good: "tone-good",
    warn: "tone-warn",
    bad: "tone-bad",
    neutral: "",
} as const satisfies Record<Tone, string>;

/** Empty for `neutral`, which takes whatever colour its surroundings already have. */
export const toneClass = (tone: Tone): string => TONE_CLASSES[tone];

/** A `YYYY-MM-DD` calendar day as "6 Oct", read in UTC so the server and the browser agree. */
export const calendarDay = (day: string, month: "short" | "only" = "short"): string =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString(
        "en-GB",
        month === "only"
            ? { timeZone: "UTC", month: "short" }
            : { timeZone: "UTC", day: "numeric", month: "short" },
    );

/** "3 hours ago" beats a timestamp for the one question a report page has to answer. */
export const relativeTime = (iso: string | null | undefined): string => {
    if (!iso) return "never";

    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

    const smallest = { unit: "second" as Intl.RelativeTimeFormatUnit, size: 1 };

    const scale = [
        smallest,
        { unit: "minute" as Intl.RelativeTimeFormatUnit, size: 60 },
        { unit: "hour" as Intl.RelativeTimeFormatUnit, size: 3600 },
        { unit: "day" as Intl.RelativeTimeFormatUnit, size: 86_400 },
        { unit: "month" as Intl.RelativeTimeFormatUnit, size: 2_592_000 },
        { unit: "year" as Intl.RelativeTimeFormatUnit, size: 31_536_000 },
    ];

    // The largest unit the gap fills at least once — "3 hours ago", never "180 minutes ago".
    const step = scale.findLast((entry) => Math.abs(seconds) >= entry.size) ?? smallest;

    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        -Math.round(seconds / step.size),
        step.unit,
    );
};
