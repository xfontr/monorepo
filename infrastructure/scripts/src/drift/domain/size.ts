import { hasRename, parseLinesChanged, type ChangeSize } from "./detect.ts";

export const lastMdCommitMs = (seconds: string): number | undefined =>
    seconds ? Number(seconds) * 1000 : undefined;

export const changeSize = (numstat: string[], nameStatus: string[]): ChangeSize => ({
    linesChanged: parseLinesChanged(numstat),
    filesChanged: numstat.length,
    renamed: hasRename(nameStatus),
});
