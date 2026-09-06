import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// `import.meta.dirname` is undefined once Nitro bundles this module, and these paths are read from
// both a plain `node tools/…` process and a server route. `import.meta.url` survives both.
const here = dirname(fileURLToPath(import.meta.url));

/** `apps/dashboard` — every other path is derived from these two so nothing hard-codes a depth. */
export const PROJECT_ROOT = resolve(here, "../..");
export const WORKSPACE_ROOT = resolve(PROJECT_ROOT, "../..");

/** Derived and gitignored. Deleting it costs one `pnpm dashboard:collect`. */
export const SNAPSHOT_DIR = resolve(PROJECT_ROOT, ".report");

/** Written by `pnpm test:coverage`: one merged report over every project. */
export const MERGED_COVERAGE_DIR = resolve(WORKSPACE_ROOT, "coverage");

/**
 * Served statically: Nx's own graph client and the merged coverage report, copied in as-is. They sit
 * under `embed/` because Nitro serves `public/` ahead of the page routes — a tree at
 * `public/coverage/` silently shadows the `/coverage` page with somebody else's `index.html`.
 */
const PUBLIC_DIR = resolve(PROJECT_ROOT, "public");
export const EMBED_DIR = resolve(PUBLIC_DIR, "embed");
export const GRAPH_DIR = resolve(EMBED_DIR, "graph");
export const COVERAGE_DIR = resolve(EMBED_DIR, "coverage");

export const SCHEMA_VERSION = 1;
