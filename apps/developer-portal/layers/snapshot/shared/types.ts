/** This app stores nothing — everything below is either derived from the repo or read live from elsewhere. */

import type { AuditFinding } from "./audits.ts";
import type { DecisionOutcome, DecisionStatus } from "./decisions.ts";

export interface ArtifactStatus {
    generatedAt: string;
    ok: boolean;
    error?: string;
}

export interface Manifest {
    schemaVersion: number;
    generatedAt: string;
    commit: string;
    branch: string;
    artifacts: Record<string, ArtifactStatus>;
}

export interface ProjectNode {
    name: string;
    root: string;
    tags: string[];
    dependsOn: string[];
    dependedOnBy: string[];
}

/** A project whose `package.json` was deleted, read back from git history. */
export interface RetiredProject {
    name: string;
    root: string;
    tags: string[];
    deletedAt: string;
    commit: string;
    subject: string;
    /** Commits that touched its root, the deleting one included. */
    commits: number;
}

export interface ProjectsArtifact {
    generatedAt: string;
    projects: ProjectNode[];
    retired: RetiredProject[];
}

export interface CoverageMetric {
    total: number;
    covered: number;
    pct: number;
}

export interface ProjectCoverage {
    name: string;
    root: string;
    /**
     * False means no usable coverage report was found. Distinct from 0% — a project with no test
     * target and a project whose tests cover nothing are different facts, and averaging them
     * together is how a coverage number stops meaning anything.
     */
    collected: boolean;
    files: number;
    lines?: CoverageMetric;
    statements?: CoverageMetric;
    functions?: CoverageMetric;
    branches?: CoverageMetric;
}

export interface CoverageArtifact {
    generatedAt: string;
    /** Weighted across collected projects only; null when nothing was collected. */
    totals: { lines: number; statements: number; functions: number; branches: number } | null;
    /** Whether the merged HTML report was copied into `public/coverage/`. */
    report: boolean;
    projects: ProjectCoverage[];
}

export interface ProjectMetrics {
    name: string;
    root: string;
    specs: number;
    commits: number | null;
    commitsLastTwoWeeks: number | null;
    coverageLinesPct: number | null;
    unreleasedCommits: number | null;
    currentVersion: string | null;
    hasChangelog: boolean;
}

export interface InvariantFinding {
    id: string;
    title: string;
    detail: string;
    evidence: string[];
}

export interface MetricsArtifact {
    generatedAt: string;
    commit: string;
    branch: string;
    projects: ProjectMetrics[];
    invariantFindings: InvariantFinding[];
    conventionalCommitRate: number | null;
    commitsSinceLastRelease: number | null;
}

export interface DocLink {
    href: string;
    /** Repo-relative, never absolute — an absolute path leaks the machine's home directory. */
    resolved: string;
}

/**
 * `doc`, `decision` and `audit` are the ones that live under `docs/`, which is where anything
 * spanning more than one project belongs. The rest are colocated with the code they describe.
 */
export type DocKind = "readme" | "agent" | "changelog" | "skill" | "doc" | "decision" | "audit";

/** Both derive from the value lists in `shared/decisions.ts`, which is also what the CI check reads — so there is no second copy to keep in step. */
export type { DecisionOutcome, DecisionStatus };

export interface DocPage {
    path: string;
    kind: DocKind;
    title: string;
    words: number;
    updatedAt: string | null;
    /** Parsed from a decision report's frontmatter; null for anything that isn't one. */
    decisionStatus: DecisionStatus | null;
    decisionOutcome: DecisionOutcome | null;
    /** The file a superseded decision was replaced by; null unless `decisionOutcome` is `"superseded"`. */
    decisionSupersededBy: string | null;
    /** Parsed from an audit's frontmatter and findings tables; null for anything that isn't one. */
    audit: AuditMeta | null;
    brokenLinks: DocLink[];
}

export interface AuditMeta {
    /** The project or path the audit read, as its frontmatter names it; null when missing. */
    scope: string | null;
    commit: string | null;
    findings: AuditFinding[];
}

export interface DocsArtifact {
    generatedAt: string;
    pages: DocPage[];
    brokenLinkCount: number;
}

export interface VulnerabilityAdvisory {
    id: number;
    title: string;
    moduleName: string;
    severity: "info" | "low" | "moderate" | "high" | "critical";
    patchedVersions: string;
    url: string;
    /** `.>minimatch` notation — pnpm's own dependency chain, not a filesystem path. */
    paths: string[];
}

export interface OutdatedPackage {
    name: string;
    current: string;
    wanted: string;
    latest: string;
    isDeprecated: boolean;
    /** Repo-relative project roots — `pnpm outdated` itself reports an absolute filesystem path. */
    dependents: string[];
}

export interface DepsArtifact {
    generatedAt: string;
    /** Null when `pnpm audit` itself failed to run — distinct from every count being 0. */
    vulnerabilities: {
        info: number;
        low: number;
        moderate: number;
        high: number;
        critical: number;
    } | null;
    /** Null alongside `vulnerabilities` — same collection failure, not a separate one. */
    totalDependencies: number | null;
    advisories: VulnerabilityAdvisory[];
    /** Null when `pnpm outdated` itself failed to run — distinct from an empty array, which means nothing is outdated. */
    outdated: OutdatedPackage[] | null;
}

/** One script's runs on one calendar day. */
export interface DayUsage {
    runs: number;
    /** Runs whose caller is not `human`. */
    agent: number;
    failures: number;
}

/** One script's runs, summed from the rows in `.telemetry/scripts/*.csv`. */
export interface ScriptUsage {
    runs: number;
    /** Runs inside the last `UsageArtifact.windowDays`, so a script busy a year ago doesn't read as busy. */
    recent: number;
    /** Non-zero exits other than Ctrl+C. */
    failures: number;
    /** Runs with no terminal: piped, or run by an agent. */
    headless: number;
    totalMs: number;
    first: string;
    last: string;
    /** `human`, or the agent's name, e.g. `claude-code`. */
    callers: Record<string, number>;
    commands: Record<string, number>;
    /** Projects named on the command line, e.g. `pnpm dev huella-legal`. */
    targets: Record<string, number>;
    /** The `<area>` segment of the branch each run happened on, or `repo`. */
    areas: Record<string, number>;
    flags: Record<string, number>;
    /**
     * Keyed by `YYYY-MM-DD`, holding only days inside the window that had a run. Missing from a
     * snapshot collected before per-day counts were kept.
     */
    days?: Record<string, DayUsage>;
}

/** One ESLint rule, from `.telemetry/lint/*.csv`. Only edits made by an agent are ever linted there. */
export interface LintRuleUsage {
    /** Switched on in at least one project's config. */
    enabled: boolean;
    /** Problems reported, counted again on every edit to a file that still has them. */
    hits: number;
    recent: number;
    fixable: number;
    last: string | null;
    projects: Record<string, number>;
    /** `eslint-disable` comments naming it in the committed code. */
    disabled: number;
}

export interface LintUsage {
    /** The day of the oldest recorded hit, so "never fired" can be read against how long it's been watched. */
    since: string | null;
    rules: Record<string, LintRuleUsage>;
}

export interface UsageArtifact {
    generatedAt: string;
    windowDays: number;
    /** Every script folder, so one that was never run can be told apart from one nobody listed. */
    known: string[];
    scripts: Record<string, ScriptUsage>;
    lint: LintUsage;
}
