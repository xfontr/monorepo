#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { hooks, projectCommands, rootCommands, skills, workflows } from "./capabilities.ts";
import {
    docs,
    hookNames,
    MAP_PATH,
    projectScripts,
    readMap,
    REPO_ROOT,
    rootScripts,
    skillFiles,
    workflowFiles,
} from "./read.ts";
import { render } from "./render.ts";

const scripts = rootScripts();

const rendered = render(
    [
        ...rootCommands(scripts),
        ...projectCommands(projectScripts(), scripts),
        ...hooks(hookNames()),
        ...workflows(workflowFiles()),
        ...skills(skillFiles()),
    ],
    docs(),
);

// `--check` asserts only that the checked-in file matches this render, which is what makes adding
// a script without regenerating a CI failure. It deliberately does not fail on a `—` row: some
// capabilities are undocumented on purpose (`pnpm release` runs from the Release workflow, never
// locally), and a gate that fires on those gets switched off within a week.
if (process.argv.includes("--check")) {
    if (readMap() !== rendered) {
        process.stderr.write(`${MAP_PATH} is out of date. Run \`pnpm docs:map\` and commit the result.\n`);
        process.exit(1);
    }

    process.stdout.write(`${MAP_PATH} is up to date.\n`);
    process.exit(0);
}

writeFileSync(join(REPO_ROOT, MAP_PATH), rendered);
process.stdout.write(`Wrote ${MAP_PATH}.\n`);
