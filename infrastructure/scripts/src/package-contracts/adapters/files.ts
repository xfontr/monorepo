import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { at } from "../../shared/adapters/git.ts";
import type { PackageSource } from "../domain/validate.ts";

const filesUnder = (directory: string, root: string, found: string[] = []): string[] => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            filesUnder(path, root, found);
        }
        else if (entry.isFile()) {
            found.push(relative(root, path).replaceAll("\\", "/"));
        }
    }

    return found;
};

const packageDirectories = (): string[] =>
    readdirSync(at("packages"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

export const readPackages = (): PackageSource[] =>
    packageDirectories().map((directory) => {
        const packageRoot = at("packages", directory);
        const manifestPath = join(packageRoot, "package.json");
        let manifest: unknown;
        let readError: string | undefined;

        try {
            manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
        }
        catch (error) {
            readError = error instanceof Error ? error.message : String(error);
        }

        return {
            directory,
            files: filesUnder(packageRoot, packageRoot),
            manifest,
            readError,
        };
    });
