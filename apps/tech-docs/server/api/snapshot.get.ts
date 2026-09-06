import { defineEventHandler } from "h3";
import type {
    CoverageArtifact,
    DocsArtifact,
    Manifest,
    MetricsArtifact,
    ProjectsArtifact,
    ScorecardsArtifact,
} from "../../shared/types.ts";
import { readArtifact } from "../utils/store.ts";

export interface SnapshotResponse {
    manifest: Manifest | null
    projects: ProjectsArtifact | null
    coverage: CoverageArtifact | null
    metrics: MetricsArtifact | null
    docs: DocsArtifact | null
    scorecards: ScorecardsArtifact | null
}

/**
 * One route for the whole snapshot rather than one per artifact. Every page shows the staleness line
 * from the manifest next to its own panel, so they would all fetch each other anyway — and a null
 * here means "not collected yet", which each page renders rather than treating as an error.
 */
export default defineEventHandler(async (): Promise<SnapshotResponse> => {
    const [manifest, projects, coverage, metrics, docs, scorecards] = await Promise.all([
        readArtifact<Manifest>("manifest"),
        readArtifact<ProjectsArtifact>("projects"),
        readArtifact<CoverageArtifact>("coverage"),
        readArtifact<MetricsArtifact>("metrics"),
        readArtifact<DocsArtifact>("docs"),
        readArtifact<ScorecardsArtifact>("scorecards"),
    ]);

    return { manifest, projects, coverage, metrics, docs, scorecards };
});
