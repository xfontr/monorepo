import { defineEventHandler } from "h3";
import type { DepsArtifact } from "../../shared/types.ts";
import { readArtifact } from "../utils/store.ts";

export default defineEventHandler(async () => {
    const deps = await readArtifact<DepsArtifact>("deps");

    return { advisories: deps?.advisories.length ?? 0 };
});
