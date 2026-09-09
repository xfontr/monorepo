import { writeFileSync } from "node:fs";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { at } from "../shared/adapters/git.ts";
import { out } from "../shared/adapters/io.ts";
import {
    docs,
    hookNames,
    MAP_PATH,
    projectScripts,
    readMap,
    rootScripts,
    skillFiles,
    workflowFiles,
} from "./adapters/files.ts";
import { hooks, projectCommands, rootCommands, skills, workflows } from "./domain/capabilities.ts";
import { render } from "./domain/render.ts";

export const main = ({ flags }: Args): void => {
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

    if (flags.has("check")) {
        if (readMap() !== rendered) {
            throw new ExpectedError(`${MAP_PATH} is out of date. Run \`pnpm docs:map\` and commit the result.`);
        }

        out.success(`${MAP_PATH} is up to date.`);
        return;
    }

    writeFileSync(at(MAP_PATH), rendered);
    out.success(`Wrote ${MAP_PATH}.`);
};
