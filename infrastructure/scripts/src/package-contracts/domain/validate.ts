import { posix } from "node:path";

export type PackageSource = {
    directory: string
    files: string[]
    manifest: unknown
    readError?: string
};

export type PackageReport = {
    packageName: string
    errors: string[]
    skipped: string[]
};

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const valueText = (value: unknown): string => {
    const rendered = JSON.stringify(value);
    return rendered ?? String(value);
};

const packageNameFor = (directory: string): string => `@monorepo/${directory}`;

const errorFor = (packageName: string, field: string, message: string): string =>
    `${packageName}: ${field} ${message}`;

const validateStringField = (
    packageName: string,
    manifest: JsonObject,
    field: string,
    expected: (value: string) => boolean,
    expectation: string,
    errors: string[],
): void => {
    const value = manifest[field];

    if (typeof value !== "string" || !expected(value)) {
        errors.push(errorFor(packageName, field, `must be ${expectation}; received ${valueText(value)}`));
    }
};

const validateObjectField = (
    packageName: string,
    manifest: JsonObject,
    field: string,
    errors: string[],
): JsonObject | undefined => {
    const value = manifest[field];

    if (value === undefined) return undefined;
    if (!isObject(value)) {
        errors.push(errorFor(packageName, field, `must be an object; received ${valueText(value)}`));
        return undefined;
    }

    return value;
};

const wildcardCount = (value: string): number => [...value].filter((character) => character === "*").length;

const isEscapingPackage = (target: string): boolean => {
    const normalized = posix.normalize(target.slice(2));
    return normalized === ".." || normalized.startsWith("../");
};

const targetPattern = (target: string): RegExp => {
    const escaped = target
        .split("*")
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, String.raw`\$&`))
        .join(".*");

    return new RegExp(`^${escaped}$`);
};

const validateTarget = (
    packageName: string,
    exportKey: string,
    target: string,
    files: string[],
    errors: string[],
): void => {
    const field = `exports[${JSON.stringify(exportKey)}]`;

    if (!target.startsWith("./")) {
        errors.push(errorFor(packageName, field, `target must begin with "./"; received ${JSON.stringify(target)}`));
        return;
    }

    if (isEscapingPackage(target)) {
        errors.push(errorFor(packageName, field, `target escapes the package directory; received ${JSON.stringify(target)}`));
        return;
    }

    const normalized = posix.normalize(target.slice(2));
    const keyWildcards = wildcardCount(exportKey);
    const targetWildcards = wildcardCount(target);

    if (keyWildcards !== targetWildcards || keyWildcards > 1) {
        errors.push(errorFor(
            packageName,
            field,
            `wildcard key and target must each contain the same single "*"; received key ${JSON.stringify(exportKey)} and target ${JSON.stringify(target)}`,
        ));
        return;
    }

    if (targetWildcards === 1) {
        if (!files.some((file) => targetPattern(normalized).test(file))) {
            errors.push(errorFor(packageName, field, `wildcard target has no matching file: ${JSON.stringify(target)}`));
        }
        return;
    }

    if (!files.includes(normalized)) {
        errors.push(errorFor(packageName, field, `target file is missing: ${JSON.stringify(target)}`));
    }
};

const validateExportNode = (
    packageName: string,
    exportKey: string,
    value: unknown,
    path: string,
    files: string[],
    errors: string[],
): void => {
    if (typeof value === "string") {
        validateTarget(packageName, exportKey, value, files, errors);
        return;
    }

    if (!isObject(value)) {
        errors.push(errorFor(packageName, path, `must be a string or conditional object; received ${valueText(value)}`));
        return;
    }

    const entries = Object.entries(value);
    if (entries.length === 0) {
        errors.push(errorFor(packageName, path, `must not be empty; received ${valueText(value)}`));
        return;
    }

    for (const [condition, nested] of entries) {
        validateExportNode(packageName, exportKey, nested, `${path}[${JSON.stringify(condition)}]`, files, errors);
    }
};

const validateExports = (packageName: string, exports: JsonObject, files: string[], errors: string[]): void => {
    const entries = Object.entries(exports);
    const hasSubpaths = entries.some(([key]) => key.startsWith("."));

    for (const [key, value] of entries) {
        if (hasSubpaths && !key.startsWith(".")) {
            errors.push(errorFor(packageName, `exports[${JSON.stringify(key)}]`, "cannot mix condition keys with subpath keys"));
            continue;
        }

        const exportKey = hasSubpaths ? key : ".";
        validateExportNode(packageName, exportKey, value, `exports[${JSON.stringify(key)}]`, files, errors);
    }
};

const validatePeerMetadata = (
    packageName: string,
    peerDependencies: JsonObject | undefined,
    peerDependenciesMeta: JsonObject | undefined,
    errors: string[],
): boolean => {
    if (peerDependenciesMeta === undefined) return false;

    for (const [dependency, metadata] of Object.entries(peerDependenciesMeta)) {
        if (peerDependencies === undefined || !(dependency in peerDependencies)) {
            errors.push(errorFor(
                packageName,
                `peerDependenciesMeta[${JSON.stringify(dependency)}]`,
                `has no matching peerDependencies entry; received ${valueText(metadata)}`,
            ));
        }

        if (!isObject(metadata)) {
            errors.push(errorFor(
                packageName,
                `peerDependenciesMeta[${JSON.stringify(dependency)}]`,
                `must be an object; received ${valueText(metadata)}`,
            ));
            continue;
        }

        if (metadata.optional !== undefined && typeof metadata.optional !== "boolean") {
            errors.push(errorFor(
                packageName,
                `peerDependenciesMeta[${JSON.stringify(dependency)}].optional`,
                `must be boolean; received ${valueText(metadata.optional)}`,
            ));
        }
    }

    return true;
};

const validateManifestExports = (
    packageName: string,
    manifest: JsonObject,
    files: string[],
    errors: string[],
): void => {
    const exports = validateObjectField(packageName, manifest, "exports", errors);
    if (exports === undefined) {
        if (manifest.exports === undefined) {
            errors.push(errorFor(packageName, "exports", "must be a non-empty object; field is missing"));
        }
    }
    else if (Object.keys(exports).length === 0) {
        errors.push(errorFor(packageName, "exports", "must be a non-empty object; received {}"));
    }
    else {
        validateExports(packageName, exports, files, errors);
    }
};

const validateManifestPeers = (
    packageName: string,
    manifest: JsonObject,
    errors: string[],
    skipped: string[],
): void => {
    const peerDependencies = validateObjectField(packageName, manifest, "peerDependencies", errors);
    if (peerDependencies !== undefined) {
        for (const [dependency, range] of Object.entries(peerDependencies)) {
            if (typeof range !== "string" || range.trim().length === 0) {
                errors.push(errorFor(
                    packageName,
                    `peerDependencies[${JSON.stringify(dependency)}]`,
                    `must be a non-empty string; received ${valueText(range)}`,
                ));
            }
        }
    }

    const peerDependenciesMeta = validateObjectField(packageName, manifest, "peerDependenciesMeta", errors);
    if (!validatePeerMetadata(packageName, peerDependencies, peerDependenciesMeta, errors)) {
        skipped.push("peer metadata (not present)");
    }
};

export const validatePackage = (source: PackageSource): PackageReport => {
    const packageName = packageNameFor(source.directory);
    const errors: string[] = [];
    const skipped: string[] = [];

    if (source.readError !== undefined) {
        errors.push(errorFor(packageName, "package.json", `could not be parsed or read: ${source.readError}`));
        skipped.push("metadata, exports and peer metadata (manifest unavailable)");
        return { packageName, errors, skipped };
    }

    if (!isObject(source.manifest)) {
        errors.push(errorFor(packageName, "package.json", `must be a JSON object; received ${valueText(source.manifest)}`));
        skipped.push("metadata, exports and peer metadata (manifest is not an object)");
        return { packageName, errors, skipped };
    }

    const manifest = source.manifest;
    validateStringField(packageName, manifest, "name", (value) => value === packageName, `"${packageName}"`, errors);
    validateStringField(packageName, manifest, "version", (value) => value.trim().length > 0, "a non-empty string", errors);
    validateStringField(packageName, manifest, "type", (value) => value === "module", "\"module\"", errors);

    validateManifestExports(packageName, manifest, source.files, errors);
    validateManifestPeers(packageName, manifest, errors, skipped);

    const nx = validateObjectField(packageName, manifest, "nx", errors);
    if (nx?.tags !== undefined && (!Array.isArray(nx.tags) || nx.tags.some((tag) => typeof tag !== "string"))) {
        errors.push(errorFor(packageName, "nx.tags", `must be an array of strings; received ${valueText(nx.tags)}`));
    }

    return { packageName, errors, skipped };
};
