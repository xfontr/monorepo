import { gh } from "../../shared/adapters/gh.ts";
import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { ExpectedError } from "../../shared/errors.ts";
import { BOARD, COMPLEXITY_FIELD, type GhIssue } from "../domain/snapshot.ts";

interface GraphIssue {
    number: number;
    title: string;
    url: string;
    state: string;
    stateReason: string | null;
    createdAt: string;
    closedAt: string | null;
    labels: { nodes: { name: string }[] };
    blockedBy: { nodes: { number: number; state: string; closedAt?: string | null }[] };
    linkedBranches?: { totalCount: number };
    closedByPullRequestsReferences?: { totalCount: number };
    projectItems?: {
        nodes: { project: { title: string }; complexity: { number?: number } | null }[];
    };
}

const ISSUE_FIELDS = `number title url state stateReason createdAt closedAt
    labels(first: 50) { nodes { name } }
    blockedBy(first: 50) { nodes { number state closedAt } }
    projectItems(first: 20) {
      nodes {
        project { title }
        complexity: fieldValueByName(name: "${COMPLEXITY_FIELD}") { ... on ProjectV2ItemFieldNumberValue { number } }
      }
    }`;

const MILESTONE_QUERY = `query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) {
    milestone(number: $number) {
      issues(first: 100, after: $endCursor, states: [OPEN, CLOSED]) {
        pageInfo { hasNextPage endCursor }
        nodes { ${ISSUE_FIELDS} linkedBranches(first: 1) { totalCount } closedByPullRequestsReferences(first: 1, includeClosedPrs: false) { totalCount } }
      }
    }
  }
}`;

const toGhIssue = (issue: GraphIssue): GhIssue => ({
    number: issue.number,
    title: issue.title,
    url: issue.url,
    state: issue.state,
    stateReason: issue.stateReason ?? "",
    createdAt: issue.createdAt,
    closedAt: issue.closedAt,
    labels: issue.labels.nodes,
    blockedBy: issue.blockedBy.nodes.map(({ number, state, closedAt }) => ({
        number,
        state,
        closedAt: closedAt ?? null,
    })),
    branches: issue.linkedBranches?.totalCount ?? 0,
    pullRequests: issue.closedByPullRequestsReferences?.totalCount ?? 0,
    complexity:
        issue.projectItems?.nodes.find(({ project }) => project.title === BOARD)?.complexity
            ?.number ?? null,
});

const milestoneNumber = (title: string): number => {
    const found = gh(
        "api",
        "repos/{owner}/{repo}/milestones?state=all&per_page=100",
        "--jq",
        `.[] | select(.title == ${JSON.stringify(title)}) | .number`,
    ).trim();

    if (!found) throw new ExpectedError(`No milestone called "${title}" on GitHub.`);
    return Number(found);
};

/** Every issue in the milestone with its blockers and linked branches, one paginated GraphQL read. */
export const milestoneIssues = (milestone: string): GhIssue[] =>
    gh(
        "api",
        "graphql",
        "--paginate",
        "-F",
        "owner={owner}",
        "-F",
        "name={repo}",
        "-F",
        `number=${milestoneNumber(milestone)}`,
        "-f",
        `query=${MILESTONE_QUERY}`,
        "--jq",
        ".data.repository.milestone.issues.nodes[]",
    )
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => toGhIssue(JSON.parse(line) as GraphIssue));

/** Open issues under the area label that nobody put in a milestone — what a hand-filed ticket usually is. */
export const areaIssuesWithoutMilestone = (area: string): GhIssue[] =>
    (
        JSON.parse(
            gh(
                "issue",
                "list",
                `--label=${area}`,
                "--search",
                "no:milestone",
                "--state",
                "open",
                "--limit",
                "1000",
                "--json",
                "number,title,url,state,stateReason,labels,createdAt,closedAt,blockedBy",
            ),
        ) as (Omit<GraphIssue, "labels"> & { labels: { name: string }[] })[]
    ).map((issue) => toGhIssue({ ...issue, labels: { nodes: issue.labels } }));

export interface NewTicket {
    title: string;
    body: string;
    milestone: string;
    labels: string[];
    blockedBy: number[];
    complexity: number | null;
}

const boardNumber = (owner: string): string => {
    const found = gh(
        "project",
        "list",
        "--owner",
        owner,
        "--format",
        "json",
        "--jq",
        `.projects[] | select(.title == ${JSON.stringify(BOARD)}) | .number`,
    ).trim();

    if (!found) throw new ExpectedError(`No project board called "${BOARD}" for ${owner}.`);
    return found;
};

const setComplexity = (url: string, complexity: number): void => {
    const owner = gh("repo", "view", "--json", "owner", "--jq", ".owner.login").trim();

    gh(
        "project",
        "item-edit",
        boardNumber(owner),
        "--owner",
        owner,
        "--url",
        url,
        "--field",
        COMPLEXITY_FIELD,
        "--number",
        String(complexity),
    );
};

/** Files one ticket on the board and returns its URL; the blocked-by links are GitHub's own, not body text. */
export const createTicket = ({
    title,
    body,
    milestone,
    labels,
    blockedBy,
    complexity,
}: NewTicket): string => {
    const url = gh(
        "issue",
        "create",
        // The `=` form keeps a value starting with `-`, such as a markdown checklist, from reading as a flag.
        `--title=${title}`,
        `--body=${body}`,
        `--milestone=${assertNotFlagLike(milestone, "milestone")}`,
        "--project",
        BOARD,
        ...labels.flatMap((label) => ["--label", assertNotFlagLike(label, "label")]),
        ...(blockedBy.length > 0 ? ["--blocked-by", blockedBy.join(",")] : []),
    ).trim();

    if (complexity !== null) setComplexity(url, complexity);
    return url;
};

/** Closes as not planned, which the snapshot reads back as `dropped`. */
export const closeAsNotPlanned = (number: number): void => {
    gh("issue", "close", String(number), "--reason", "not planned");
};

export const closeMilestone = (title: string): void => {
    gh(
        "api",
        "--method",
        "PATCH",
        `repos/{owner}/{repo}/milestones/${milestoneNumber(title)}`,
        "-f",
        "state=closed",
    );
};
