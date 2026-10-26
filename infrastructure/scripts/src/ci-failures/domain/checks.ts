export interface Check {
    name: string;
    bucket: string;
    state: string;
    link: string;
    workflow: string;
    description: string;
}

export interface Job {
    run: string;
    job: string;
}

export interface Grouped {
    failed: Check[];
    pending: Check[];
    passed: number;
}

/** `gh`'s buckets: pass, fail, pending, skipping and cancel. */
export const group = (checks: Check[]): Grouped => ({
    failed: checks.filter(({ bucket }) => bucket === "fail" || bucket === "cancel"),
    pending: checks.filter(({ bucket }) => bucket === "pending"),
    passed: checks.filter(({ bucket }) => bucket === "pass" || bucket === "skipping").length,
});

export const jobOf = ({ link }: Check): Job | undefined => {
    const match = /\/actions\/runs\/(\d+)\/job\/(\d+)/.exec(link);
    return match?.[1] && match[2] ? { run: match[1], job: match[2] } : undefined;
};

/** `--log-failed` prefixes every line with the job and the step, and most with a timestamp. */
export const stripLogPrefix = (log: string): string =>
    log
        .split("\n")
        .map((line) => line.replace(/^[^\t]*\t[^\t]*\t\ufeff?(?:\d{4}-\d\d-\d\dT[\d:.]+Z ?)?/, ""))
        .filter((line) => !/^##\[(?:group|endgroup)\]/.test(line))
        .join("\n");

export const headline = (pr: string, { failed, pending, passed }: Grouped): string =>
    `${pr}: ${failed.length} failed, ${pending.length} pending, ${passed} passed or skipped`;

export const externalCheck = ({ name, state, description, link }: Check): string[] => [
    `✖ ${name} (${state.toLowerCase()})`,
    ...(description ? [`  ${description}`] : []),
    `  ${link || "no link"}`,
];
