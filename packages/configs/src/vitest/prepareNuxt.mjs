import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Must stay `.mjs`: a `.ts` setup file is transformed by the pipeline this repairs, so it fails
// before its first line runs.

/** Regenerates `.nuxt` when a Nuxt project is tested without it. */
export default function prepareNuxt(project) {
    const root = project.config.root;

    if (!existsSync(resolve(root, "nuxt.config.ts"))) return;
    if (existsSync(resolve(root, ".nuxt/tsconfig.app.json"))) return;

    execFileSync(resolve(root, "node_modules/.bin/nuxi"), ["prepare"], { cwd: root, stdio: "inherit" });
}
