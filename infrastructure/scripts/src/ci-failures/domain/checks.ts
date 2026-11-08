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

export interface SonarPullRequest {
    origin: string;
    project: string;
    pullRequest: string;
}

export interface SonarIssue {
    severity: string;
    rule: string;
    component: string;
    line?: number;
    message: string;
}

/** The "SonarCloud Code Analysis" status links to `/dashboard?id=<project>&pullRequest=<n>`. */
export const sonarPullRequestOf = ({ link }: Check): SonarPullRequest | undefined => {
    if (!URL.canParse(link)) return undefined;

    const url = new URL(link);
    const project = url.searchParams.get("id");
    const pullRequest = url.searchParams.get("pullRequest");

    return url.pathname === "/dashboard" && project && pullRequest
        ? { origin: url.origin, project, pullRequest }
        : undefined;
};

/** Sonar's component is `<project>:<path>`; the path alone is what an agent opens. */
export const sonarIssueLines = ({ project }: SonarPullRequest, issues: SonarIssue[]): string[] =>
    issues.map(({ severity, rule, component, line, message }) => {
        const path = component.startsWith(`${project}:`)
            ? component.slice(project.length + 1)
            : component;
        const at = line === undefined ? path : `${path}:${line}`;

        return `  ${severity} ${rule} ${at} — ${message}`;
    });
