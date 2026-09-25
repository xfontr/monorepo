import { beforeEach, describe, expect, it, vi } from "vitest";

const files = vi.hoisted(() => ({ readManifest: vi.fn(), digestArtifacts: vi.fn(), writeManifest: vi.fn() }));
const io = vi.hoisted(() => ({ out: { success: vi.fn(), info: vi.fn() } }));
vi.mock("./adapters/files.ts", () => ({ ...files, METHOD_PATH: "docs/reviews/METHOD.md" }));
vi.mock("../shared/adapters/io.ts", () => io);

import { METHOD_ARTIFACTS } from "./domain/manifest.ts";
import { main } from "./main.ts";

const manifest = `Method **version 2**.\n${METHOD_ARTIFACTS.map((path) => `| \`${path}\` | \`aaaaaaaaaaaa\` |`).join("\n")}\n`;
const digests = Object.fromEntries(METHOD_ARTIFACTS.map((path) => [path, "aaaaaaaaaaaa"]));

beforeEach(() => {
    vi.clearAllMocks();
    files.readManifest.mockReturnValue(manifest);
    files.digestArtifacts.mockReturnValue(digests);
});

describe("review-version main", () => {
    it("reports an unchanged manifest without rewriting it", () => {
        main({ flags: new Set(), positionals: [] });

        expect(files.writeManifest).not.toHaveBeenCalled();
        expect(io.out.success).toHaveBeenCalledWith(`docs/reviews/METHOD.md is at version 2, ${METHOD_ARTIFACTS.length} artifacts unchanged.`);
    });

    it("rejects stale artifacts in check mode", () => {
        files.digestArtifacts.mockReturnValue({ "docs/reviews/SCORECARDS.md": "changed" });

        expect(() => main({ flags: new Set(["check"]), positionals: [] })).toThrow(
            "The review method changed without its version",
        );
    });

    it("accepts an unchanged manifest in check mode", () => {
        main({ flags: new Set(["check"]), positionals: [] });

        expect(io.out.success).toHaveBeenCalledWith(`docs/reviews/METHOD.md is at version 2, ${METHOD_ARTIFACTS.length} artifacts unchanged.`);
    });

    it("updates a stale manifest and reports the new version", () => {
        files.digestArtifacts.mockReturnValue({ "docs/reviews/SCORECARDS.md": "changed" });

        main({ flags: new Set(), positionals: [] });

        expect(files.writeManifest).toHaveBeenCalled();
        expect(io.out.success).toHaveBeenCalledWith(expect.stringContaining("Wrote docs/reviews/METHOD.md"));
        expect(io.out.info).toHaveBeenCalled();
    });
});
