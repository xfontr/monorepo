import { defineEventHandler, getRouterParam } from "h3";
import type {
    CoverageArtifact,
    DepsArtifact,
    DocsArtifact,
    Manifest,
    MetricsArtifact,
    ProjectsArtifact,
    ScorecardsArtifact,
} from "../../../shared/types.ts";
import { readArtifact } from "../../utils/store.ts";

export interface SnapshotResponse {
    manifest: Manifest | null
    projects?: ProjectsArtifact | null
    coverage?: CoverageArtifact | null
    metrics?: MetricsArtifact | null
    deps?: DepsArtifact | null
    docs?: DocsArtifact | null
    scorecards?: ScorecardsArtifact | null
}

const readers = {
    projects: () => readArtifact<ProjectsArtifact>("projects"),
    coverage: () => readArtifact<CoverageArtifact>("coverage"),
    metrics: () => readArtifact<MetricsArtifact>("metrics"),
    deps: () => readArtifact<DepsArtifact>("deps"),
    docs: () => readArtifact<DocsArtifact>("docs"),
    scorecards: () => readArtifact<ScorecardsArtifact>("scorecards"),
};

export default defineEventHandler(async (event): Promise<SnapshotResponse> => {
    const artifact = getRouterParam(event, "artifact");
    const manifest = await readArtifact<Manifest>("manifest");

    const read = artifact && artifact in readers ? readers[artifact as keyof typeof readers] : undefined;

    if (!read) return { manifest };

    const value = await read();

    return { manifest, [artifact as string]: value } as SnapshotResponse;
});
