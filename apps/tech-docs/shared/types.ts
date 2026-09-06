/**
 * This app stores nothing. Everything down to `DocsArtifact` is **derived** — `pnpm
 * tech-docs:collect` rebuilds it from the repo in seconds, so `.report/` is gitignored and a stale
 * copy costs one command. `Issue` is **somebody else's record**, read live off GitHub through `gh`
 * and never written down here; so are the docs, the reviews and the changelogs, which are files in
 * the tree read where they live.
 */

export interface ArtifactStatus {
    generatedAt: string
    ok: boolean
    error?: string
}

export interface Manifest {
    schemaVersion: number
    generatedAt: string
    commit: string
    branch: string
    artifacts: Record<string, ArtifactStatus>
}

export interface ProjectNode {
    name: string
    root: string
    tags: string[]
    targets: string[]
    private: boolean
    dependsOn: string[]
    dependedOnBy: string[]
}

export interface ProjectsArtifact {
    generatedAt: string
    projects: ProjectNode[]
    edges: { source: string, target: string, type: string }[]
}

export interface CoverageMetric {
    total: number
    covered: number
    pct: number
}

export interface ProjectCoverage {
    name: string
    root: string
    /**
     * False means no `coverage-summary.json` was found. Distinct from 0% — a project with no test
     * target and a project whose tests cover nothing are different facts, and averaging them
     * together is how a coverage number stops meaning anything.
     */
    collected: boolean
    files: number
    lines?: CoverageMetric
    statements?: CoverageMetric
    functions?: CoverageMetric
    branches?: CoverageMetric
}

export interface CoverageArtifact {
    generatedAt: string
    /** Weighted across collected projects only; null when nothing was collected. */
    totals: { lines: number, statements: number, functions: number, branches: number } | null
    /** Whether the merged HTML report was copied into `public/coverage/`. */
    report: boolean
    projects: ProjectCoverage[]
}

export interface ProjectMetrics {
    name: string
    root: string
    specs: number
    sources: number
    specRatio: number
    coverageLinesPct: number | null
    unreleasedCommits: number | null
    currentVersion: string | null
    hasReadme: boolean
    hasClaudeMd: boolean
    hasChangelog: boolean
}

export interface InvariantFinding {
    id: string
    title: string
    detail: string
    evidence: string[]
}

export interface MetricsArtifact {
    generatedAt: string
    commit: string
    branch: string
    projects: ProjectMetrics[]
    boundaryViolations: number | null
    invariantFindings: InvariantFinding[]
    conventionalCommitRate: number | null
    commitsSinceLastRelease: number | null
}

export interface DocLink {
    href: string
    /** Repo-relative, never absolute — an absolute path leaks the machine's home directory. */
    resolved: string
}

/**
 * `doc`, `review` and `spike` are the ones that live under `docs/`, which is where anything
 * spanning more than one project belongs. The rest are colocated with the code they describe.
 */
export type DocKind = "readme" | "claude" | "changelog" | "skill" | "doc" | "review" | "spike";

/**
 * A spike report's own outcome, not the decision it argues for — `docs/spikes/README.md` calls
 * this out as the one line in the file expected to change after the report is written.
 */
export type SpikeStatus = "to-implement" | "implemented" | "wont-implement";

export interface DocPage {
    path: string
    project: string | null
    kind: DocKind
    title: string
    headings: string[]
    words: number
    updatedAt: string | null
    /** Whether the doc carries a `## 🧭 Deliberately deferred` section. */
    deferred: boolean
    /** Parsed from a spike report's `Status:` line; null for anything that isn't one. */
    spikeStatus: SpikeStatus | null
    brokenLinks: DocLink[]
}

export interface DocsArtifact {
    generatedAt: string
    pages: DocPage[]
    brokenLinkCount: number
}

export interface ScoreRow {
    card: string
    score: number
    delta: string
    verdict: string
}

export interface ReviewScorecard {
    /** `docs/reviews/<file>`, so a row can link straight to the review the `reviews` page renders. */
    path: string
    date: string
    commit: string
    cards: ScoreRow[]
    total: number
    totalDelta: string
    /**
     * Set when the file's `## 🧮 Scores` table doesn't match `SCORECARDS.md`'s seven cards, in
     * order — `cards` still holds whatever rows were readable, never a guess at the rest.
     */
    parseError: string | null
}

export interface ScorecardsArtifact {
    generatedAt: string
    /** Most recent review first. */
    reviews: ReviewScorecard[]
}

/**
 * One open issue, as `gh issue list --json` hands it over. Nothing here is stored: the issue's
 * state lives on GitHub, and a copy kept in this repo would be a second answer to a question that
 * already has one — which is why the local todo list that used to sit here is gone.
 */
export interface Issue {
    number: number
    title: string
    /** Raw markdown. Clamped where it is rendered, so the page decides how much of it fits. */
    body: string
    url: string
    /**
     * Names only. GitHub's own label colours are arbitrary and this app's palette is three
     * validated status roles — rendering one beside the other is how a page stops meaning anything.
     */
    labels: string[]
    assignees: string[]
    /** The GitHub Project board the issue sits on, and its column there. Null when it is on none. */
    project: string | null
    projectStatus: string | null
    createdAt: string
    updatedAt: string
}

export interface IssuesArtifact {
    fetchedAt: string
    /**
     * Null when `gh` answered. A string when it did not — not installed, not authenticated, offline.
     * Rendered as its own state rather than thrown: an unreachable GitHub is a fact about the
     * machine, not a broken page.
     */
    error: string | null
    issues: Issue[]
}
