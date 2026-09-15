import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { out } from "../shared/adapters/io.ts";
import { digestArtifacts, METHOD_PATH, readManifest, writeManifest } from "./adapters/files.ts";
import { parseManifest, staleArtifacts, updateManifest } from "./domain/manifest.ts";

export const main = ({ flags }: Args): void => {
    const before = readManifest();
    const digests = digestArtifacts();
    const stale = staleArtifacts(parseManifest(before), digests);

    if (flags.has("check")) {
        if (stale.length > 0) {
            throw new ExpectedError(
                `The review method changed without its version: ${stale.join(", ")}.\n`
                + "Run `pnpm review:version` and commit the result.",
            );
        }

        out.success(`${METHOD_PATH} is at version ${parseManifest(before)?.version}, four artifacts unchanged.`);
        return;
    }

    const after = updateManifest(before, digests);

    if (after === before) {
        out.success(`${METHOD_PATH} is at version ${parseManifest(before)?.version}, four artifacts unchanged.`);
        return;
    }

    writeManifest(after);

    const from = parseManifest(before)?.version;
    const to = parseManifest(after)?.version;

    out.success(`Wrote ${METHOD_PATH} — version ${to} (was ${from}).`);
    out.info("A bump owes the calibration re-score: score the previous review's commit under the new method.");
};
