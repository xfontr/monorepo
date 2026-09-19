import { basename } from "node:path";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { out } from "../shared/adapters/io.ts";
import {
    instructionFiles,
    MANIFEST_PATH,
    matchesBytes,
    matchesText,
    modeOf,
    readBytes,
    readManifest,
    readText,
    removeFile,
    skillFiles,
    writeBytes,
    writeText,
} from "./adapters/files.ts";
import {
    claudeDocPath,
    claudeSkillPath,
    renderGeneratedMarkdown,
    renderManifest,
    staleTargets,
} from "./domain/generate.ts";

type Output = {
    target: string
    contents: string | Buffer
    mode: number
};

const outputs = (): Output[] => [
    ...instructionFiles().map((source) => ({
        target: claudeDocPath(source),
        contents: renderGeneratedMarkdown(readText(source), source),
        mode: modeOf(source),
    })),
    ...skillFiles().map((source) => ({
        target: claudeSkillPath(source),
        contents: basename(source) === "SKILL.md"
            ? renderGeneratedMarkdown(readText(source), source)
            : readBytes(source),
        mode: modeOf(source),
    })),
];

const matches = ({ target, contents }: Output): boolean =>
    typeof contents === "string" ? matchesText(target, contents) : matchesBytes(target, contents);

export const main = ({ flags }: Args): void => {
    const generated = outputs();
    const expected = generated.map(({ target }) => target);
    const manifest = renderManifest(expected);
    const stale = staleTargets(readManifest(), expected);

    if (flags.has("check")) {
        const changed = generated.filter((file) => !matches(file)).map(({ target }) => target);
        if (!matchesText(MANIFEST_PATH, manifest)) changed.push(MANIFEST_PATH);
        if (changed.length > 0 || stale.length > 0) {
            throw new ExpectedError(
                `Claude adapters are out of date: ${[...changed, ...stale].join(", ")}. Run \`pnpm agents:sync\`.`,
            );
        }

        out.success(`${expected.length} Claude adapters are up to date.`);
        return;
    }

    for (const file of generated) {
        if (typeof file.contents === "string") writeText(file.target, file.contents, file.mode);
        else writeBytes(file.target, file.contents, file.mode);
    }

    for (const path of stale) removeFile(path);
    writeText(MANIFEST_PATH, manifest);
    out.success(`Wrote ${expected.length} Claude adapters and ${MANIFEST_PATH}.`);
};
