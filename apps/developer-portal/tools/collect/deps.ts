import { relative } from "node:path";
import type { DepsArtifact, OutdatedPackage, VulnerabilityAdvisory } from "../../shared/types.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { runAllowFailure, tryRun } from "../lib/run.ts";

// The only pair of collectors that reach the npm registry instead of reading the working tree —
// offline or rate-limited is a real, separate failure mode from everything else here.

interface RawAdvisory {
    id: number
    title: string
    module_name: string
    severity: VulnerabilityAdvisory["severity"]
    vulnerable_versions: string
    patched_versions: string
    url: string
    findings: { paths: string[] }[]
}

interface RawAuditReport {
    advisories: Record<string, RawAdvisory>
    metadata: {
        vulnerabilities: { info: number, low: number, moderate: number, high: number, critical: number }
        totalDependencies: number
    }
}

interface RawOutdatedEntry {
    current: string
    wanted: string
    latest: string
    dependencyType: string
    isDeprecated: boolean
    dependentPackages: { name: string, location: string }[]
}

async function collectAudit(): Promise<Pick<DepsArtifact, "vulnerabilities" | "totalDependencies" | "advisories"> | null> {
    const result = await tryRun(async () => {
        const stdout = await runAllowFailure("pnpm", ["audit", "--json"], WORKSPACE_ROOT);

        return JSON.parse(stdout) as RawAuditReport;
    });

    if (!result.ok) return null;

    const { advisories, metadata } = result.value;

    return {
        vulnerabilities: metadata.vulnerabilities,
        totalDependencies: metadata.totalDependencies,
        advisories: Object.values(advisories).map((advisory) => ({
            id: advisory.id,
            title: advisory.title,
            moduleName: advisory.module_name,
            severity: advisory.severity,
            vulnerableVersions: advisory.vulnerable_versions,
            patchedVersions: advisory.patched_versions,
            url: advisory.url,
            paths: advisory.findings.flatMap((finding) => finding.paths),
        })),
    };
}

async function collectOutdated(): Promise<OutdatedPackage[] | null> {
    const result = await tryRun(async () => {
        const stdout = await runAllowFailure("pnpm", ["outdated", "-r", "--format", "json"], WORKSPACE_ROOT);

        return JSON.parse(stdout) as Record<string, RawOutdatedEntry>;
    });

    if (!result.ok) return null;

    return Object.entries(result.value).map(([name, entry]) => ({
        name,
        current: entry.current,
        wanted: entry.wanted,
        latest: entry.latest,
        dependencyType: entry.dependencyType,
        isDeprecated: entry.isDeprecated,
        dependents: entry.dependentPackages.map((pkg) => relative(WORKSPACE_ROOT, pkg.location)),
    }));
}

export async function collectDeps(generatedAt: string): Promise<DepsArtifact> {
    const [audit, outdated] = await Promise.all([collectAudit(), collectOutdated()]);

    return {
        generatedAt,
        vulnerabilities: audit?.vulnerabilities ?? null,
        totalDependencies: audit?.totalDependencies ?? null,
        advisories: audit?.advisories ?? [],
        outdated,
    };
}
