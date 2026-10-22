export interface IssueThread {
    number: number;
    title: string;
    state: string;
    url: string;
    body: string;
    labels: string[];
    assignees: string[];
    boards: { title: string; status: string | undefined }[];
    comments: { author: string; createdAt: string; body: string }[];
}

export interface IssueStatus {
    number: number;
    title: string;
    state: string;
}

export interface Decision {
    path: string;
    issue: number | undefined;
    status: string | undefined;
    decision: string | undefined;
}

export interface Brief {
    thread: IssueThread;
    blockers: IssueStatus[];
    decisions: Decision[];
    projects: { dir: string; agents: string | undefined }[];
    docs: string[];
}

const LABEL_ROOTS: Record<string, string> = { app: "apps", package: "packages" };

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const numbersIn = (text: string): number[] =>
    [...text.matchAll(/#(\d+)\b/g)].map((match) => Number(match[1]));

/** The `github-issue` task template writes `**Blocked by:** #244, #250`. */
export const blockersIn = (body: string): number[] =>
    unique(
        body
            .split("\n")
            .filter((line) => /blocked by/i.test(line))
            .flatMap(numbersIn),
    );

export const threadText = ({ body, comments }: IssueThread): string =>
    [body, ...comments.map(({ body: comment }) => comment)].join("\n");

export const referencedIssues = (thread: IssueThread): number[] =>
    unique(numbersIn(threadText(thread))).filter((number) => number !== thread.number);

/** `ADR 0028`, `decision 0028` or `0028-some-slug` in prose, as the four-digit file prefix. */
export const decisionNumbersIn = (text: string): string[] =>
    unique(
        [...text.matchAll(/\b(?:ADR|decision)\s+(\d{4})\b|\b(\d{4})-[a-z][\w-]*\.md\b/gi)].map(
            (match) => match[1] ?? match[2] ?? "",
        ),
    ).filter(Boolean);

const field = (frontmatter: string, name: string): string | undefined =>
    new RegExp(`^${name}:\\s*(.+)$`, "m").exec(frontmatter)?.[1]?.trim();

export const parseDecision = (path: string, text: string): Decision => {
    const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
    const issue = /^\d+$/.exec(field(frontmatter, "issue") ?? "")?.[0];

    return {
        path,
        issue: issue === undefined ? undefined : Number(issue),
        status: field(frontmatter, "status"),
        decision: field(frontmatter, "decision"),
    };
};

/** A decision's file number is its own, not the issue's, so the match is on frontmatter. */
export const relevantDecisions = (
    decisions: Decision[],
    issues: number[],
    mentioned: string[],
): Decision[] =>
    decisions.filter(
        ({ path, issue }) =>
            (issue !== undefined && issues.includes(issue)) ||
            mentioned.some((number) => path.includes(`/${number}-`)),
    );

export const projectsFor = (
    thread: IssueThread,
    boardSlug: string | undefined,
    dirs: string[],
): string[] => {
    const fromLabels = thread.labels.flatMap((label) => {
        const [kind, name] = label.split(":");
        const root = kind ? LABEL_ROOTS[kind] : undefined;
        return root && name ? [`${root}/${name}`] : [];
    });
    const fromBoard = boardSlug ? dirs.filter((dir) => dir.endsWith(`/${boardSlug}`)) : [];
    const fromText = [
        ...threadText(thread).matchAll(/\b(?:apps|packages|infrastructure)\/[\w-]+/g),
    ].map(([path]) => path);

    return unique([...fromLabels, ...fromBoard, ...fromText]).filter((dir) => dirs.includes(dir));
};

export const docsIn = (text: string, exists: (path: string) => boolean): string[] =>
    unique(
        [...text.matchAll(/(?<![\w./-])(?:docs|\.claude)\/[\w./-]+\.md\b/g)].map(([path]) => path),
    ).filter(exists);

const section = (title: string, lines: string[]): string[] =>
    lines.length === 0 ? [] : ["", `## ${title}`, ...lines];

export const renderBrief = ({ thread, blockers, decisions, projects, docs }: Brief): string => {
    const meta = [
        thread.state,
        thread.labels.join(", "),
        thread.assignees.map((login) => `@${login}`).join(", ") || "unassigned",
        ...thread.boards.map(({ title, status }) => `${title}: ${status ?? "no status"}`),
    ].filter(Boolean);

    return [
        `#${thread.number} ${thread.title}`,
        meta.join(" · "),
        thread.url,
        "",
        thread.body.trim() || "(no body)",
        ...section(
            `Comments (${thread.comments.length})`,
            thread.comments.flatMap(({ author, createdAt, body }) => [
                `@${author} · ${createdAt.slice(0, 10)}`,
                body.trim(),
                "",
            ]),
        ),
        ...section(
            "Blockers",
            blockers.map(({ number, title, state }) => `#${number} ${title} — ${state}`),
        ),
        ...section(
            "Decisions",
            decisions.map(({ path, status, decision }) =>
                [path, status && `status: ${status}`, decision && `decision: ${decision}`]
                    .filter(Boolean)
                    .join(" — "),
            ),
        ),
        ...section(
            "Projects",
            projects.map(({ dir, agents }) => (agents ? `${dir} — read ${agents}` : dir)),
        ),
        ...section("Docs mentioned", docs),
    ]
        .join("\n")
        .trimEnd();
};

export const issueNumberFrom = (value: string): number | undefined => {
    const match = /^#?(\d+)$|\/issues\/(\d+)\/?$/.exec(value.trim());
    const digits = match?.[1] ?? match?.[2];
    return digits ? Number(digits) : undefined;
};
