import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SNAPSHOT_DIR } from "./paths.ts";

/**
 * Nx hashes this stdout as the `runtime` input on the build. `.report/` is gitignored, so it is
 * absent from Nx's file map and a file input over it hashes nothing at all — measured: a
 * re-collected snapshot still replayed a cached `.output`.
 */
try {
    // `generatedAt` is stamped once per `collect`, so this one file clocks `public/embed/` too.
    process.stdout.write(readFileSync(resolve(SNAPSHOT_DIR, "manifest.json"), "utf8"));
}
catch {
    // A project that has never collected still has to hash to something stable.
    process.stdout.write("no-snapshot");
}
