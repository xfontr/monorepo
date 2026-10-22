// GitHub's job logs spell the escape character as the two characters `^[`.
// eslint-disable-next-line no-control-regex -- matching the escape character is the point
const ANSI = /(?:\u001b|\^\[)\[[0-9;?]*[A-Z]/gi;

/** Lines every tool prints around a failure that never help fix it. */
const NOISE = [
    /Nx Cloud/,
    /sufficient access to this workspace/,
    /^Re-run with --output-style/,
    /^View logs and run details/,
    /^\s*(Run duration|Cache|Critical path|Recoverable time):/,
    /^\[ELIFECYCLE\]/,
    /^Warning: command ".*" exited with non-zero status code/,
    /^\s*(Start at|Duration|Isolate)\s/,
    /^\s+at least ~\d/,
    /^\s*RUN\s+v\d/,
];

// The lookarounds skip `error` inside a path, such as a passing `app/error.spec.ts`.
const SIGNAL =
    /(?<![\w./-])error(?![\w./-])|\bFAIL\b|✖|×|AssertionError|Expected|Received|\bTS\d{4}\b/i;

const CONTEXT_BEFORE = 1;
const CONTEXT_AFTER = 4;

const DEFAULT_CAP = 40;

export interface Excerpt {
    lines: string[];
    /** Lines of the cleaned log that didn't make the cut. */
    omitted: number;
}

export const stripAnsi = (text: string): string => text.replaceAll(ANSI, "").replaceAll("\r", "");

const clean = (text: string): string[] => {
    const lines = stripAnsi(text)
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => !NOISE.some((pattern) => pattern.test(line)));

    const collapsed = lines.filter((line, index) => line || lines[index - 1]);
    while (collapsed[0] === "") collapsed.shift();
    while (collapsed.at(-1) === "") collapsed.pop();

    return collapsed;
};

const signalWindows = (lines: string[]): number[] => {
    const kept = new Set<number>();

    lines.forEach((line, index) => {
        if (!SIGNAL.test(line)) return;
        const last = Math.min(lines.length - 1, index + CONTEXT_AFTER);
        for (let at = Math.max(0, index - CONTEXT_BEFORE); at <= last; at++) kept.add(at);
    });

    return [...kept].sort((a, b) => a - b);
};

/** The whole log when it fits; otherwise the error lines and their context, gaps marked `…`. */
export const excerpt = (text: string, cap = DEFAULT_CAP): Excerpt => {
    const lines = clean(text);
    if (lines.length <= cap) return { lines, omitted: 0 };

    const windows = signalWindows(lines);
    // A log with no recognisable error line usually ends with the one that matters.
    const picked = windows.length > 0 ? windows : lines.map((_, index) => index).slice(-cap);

    const shown: string[] = [];
    let count = 0;
    let previous: number | undefined;

    for (const index of picked) {
        const gap = previous !== undefined && index > previous + 1;
        if (shown.length + (gap ? 2 : 1) > cap) break;
        if (gap) shown.push("…");
        shown.push(lines[index] ?? "");
        count++;
        previous = index;
    }

    return { lines: shown, omitted: lines.length - count };
};
