import { describe, expect, it } from "vitest";
import { validatePackage, type PackageSource } from "./validate.ts";

const source = (manifest: unknown, files: string[] = ["src/index.ts"]): PackageSource => ({
    directory: "demo",
    files,
    manifest,
});

const validManifest = (exports: Record<string, unknown> = {
    ".": { import: "./src/index.ts" },
}): Record<string, unknown> => ({
    name: "@monorepo/demo",
    version: "0.0.1",
    type: "module",
    exports,
});

describe("validatePackage", () => {
    it("accepts conditional exports whose string leaves point to files", () => {
        expect(validatePackage(source(validManifest({
            ".": { import: { default: "./src/index.ts" } },
        }))).errors).toEqual([]);
    });

    it("reports a missing literal export target with its export key and path", () => {
        const report = validatePackage(source(validManifest({ ".": { import: "./src/missing.ts" } })));

        expect(report.errors).toContain("@monorepo/demo: exports[\".\"] target file is missing: \"./src/missing.ts\"");
    });

    it("accepts the configs wildcard export shape when it matches a file", () => {
        const report = validatePackage(source(
            validManifest({ "./tsconfig/*": "./src/tsconfig/*" }),
            ["src/index.ts", "src/tsconfig/node.json"],
        ));

        expect(report.errors).toEqual([]);
    });

    it("reports a wildcard export with no matching files", () => {
        const report = validatePackage(source(
            validManifest({ "./tsconfig/*": "./src/tsconfig/*" }),
        ));

        expect(report.errors).toContain(
            "@monorepo/demo: exports[\"./tsconfig/*\"] wildcard target has no matching file: \"./src/tsconfig/*\"",
        );
    });

    it("rejects an export target that escapes the package directory", () => {
        const report = validatePackage(source(validManifest({ ".": { import: "./../../outside.ts" } })));

        expect(report.errors).toContain(
            "@monorepo/demo: exports[\".\"] target escapes the package directory; received \"./../../outside.ts\"",
        );
    });

    it("reports malformed export leaves with the offending value", () => {
        const report = validatePackage(source(validManifest({ ".": { import: 42 } })));

        expect(report.errors).toContain(
            "@monorepo/demo: exports[\".\"][\"import\"] must be a string or conditional object; received 42",
        );
    });

    it("reports an orphaned peer metadata key", () => {
        const report = validatePackage(source({
            ...validManifest(),
            peerDependenciesMeta: { vue: { optional: true } },
        }));

        expect(report.errors).toContain(
            "@monorepo/demo: peerDependenciesMeta[\"vue\"] has no matching peerDependencies entry; received {\"optional\":true}",
        );
    });

    it("reports an optional value that is not boolean", () => {
        const report = validatePackage(source({
            ...validManifest(),
            peerDependencies: { vue: "^3.0.0" },
            peerDependenciesMeta: { vue: { optional: "yes" } },
        }));

        expect(report.errors).toContain(
            "@monorepo/demo: peerDependenciesMeta[\"vue\"].optional must be boolean; received \"yes\"",
        );
    });

    it("reports peer metadata as skipped when the package has none", () => {
        expect(validatePackage(source(validManifest())).skipped).toEqual(["peer metadata (not present)"]);
    });

    it("collects metadata, export and peer errors together", () => {
        const report = validatePackage(source({
            name: "wrong",
            version: "",
            type: "commonjs",
            exports: { ".": { import: "./src/missing.ts" } },
            peerDependenciesMeta: { vue: { optional: "yes" } },
        }));

        expect(report.errors).toHaveLength(6);
        expect(report.errors.join("\n")).toMatch(
            /name.*version.*type.*missing.*peerDependenciesMeta.*optional/s,
        );
    });
});
