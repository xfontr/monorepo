/** This app stores nothing — everything below is either derived from the repo or read live from elsewhere. */

import type { DecisionOutcome, DecisionStatus } from "./decisions.ts";

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
    commits: number | null
    commitsPerWeek: number | null
    coverageLinesPct: number | null
    unreleasedCommits: number | null
    currentVersion: string | null
    hasReadme: boolean
    hasAgentMd: boolean
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
 * `doc`, `review` and `decision` are the ones that live under `docs/`, which is where anything
 * spanning more than one project belongs. The rest are colocated with the code they describe.
 */
export type DocKind = "readme" | "agent" | "changelog" | "skill" | "doc" | "review" | "decision";

/** Both derive from the value lists in `shared/decisions.ts`, which is also what the CI check reads — so there is no second copy to keep in step. */
export type { DecisionOutcome, DecisionStatus };

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
    /** Parsed from a decision report's frontmatter; null for anything that isn't one. */
    decisionStatus: DecisionStatus | null
    decisionOutcome: DecisionOutcome | null
    /** The file a superseded decision was replaced by; null unless `decisionOutcome` is `"superseded"`. */
    decisionSupersededBy: string | null
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

export interface VulnerabilityAdvisory {
    id: number
    title: string
    moduleName: string
    severity: "info" | "low" | "moderate" | "high" | "critical"
    vulnerableVersions: string
    patchedVersions: string
    url: string
    /** `.>minimatch` notation — pnpm's own dependency chain, not a filesystem path. */
    paths: string[]
}

export interface OutdatedPackage {
    name: string
    current: string
    wanted: string
    latest: string
    dependencyType: string
    isDeprecated: boolean
    /** Repo-relative project roots — `pnpm outdated` itself reports an absolute filesystem path. */
    dependents: string[]
}

export interface DepsArtifact {
    generatedAt: string
    /** Null when `pnpm audit` itself failed to run — distinct from every count being 0. */
    vulnerabilities: { info: number, low: number, moderate: number, high: number, critical: number } | null
    /** Null alongside `vulnerabilities` — same collection failure, not a separate one. */
    totalDependencies: number | null
    advisories: VulnerabilityAdvisory[]
    /** Null when `pnpm outdated` itself failed to run — distinct from an empty array, which means nothing is outdated. */
    outdated: OutdatedPackage[] | null
}

/** One open issue, as `gh issue list --json` hands it over. */
export interface Issue {
    number: number
    title: string
    /** Raw markdown. Clamped where it is rendered, so the page decides how much of it fits. */
    body: string
    url: string
    /** Names only — this app's own label colours come from a separate validated palette, not GitHub's. */
    labels: string[]
    assignees: string[]
    createdAt: string
    updatedAt: string
}

export interface IssuesArtifact {
    fetchedAt: string
    /** Null when `gh` answered; a string (not installed, not authenticated, offline) when it didn't. */
    error: string | null
    issues: Issue[]
}
