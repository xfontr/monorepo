import { hasRename, type ChangeSize } from "./detect.ts";

export const lastMdCommitMs = (seconds: string): number | undefined =>
    seconds ? Number(seconds) * 1000 : undefined;

export const changeSize = (numstat: string[], nameStatus: string[]): ChangeSize => ({
    linesChanged: numstat.reduce((sum, line) => {
        const [added, deleted] = line.split("\t");
        return sum + (Number(added) || 0) + (Number(deleted) || 0);
    }, 0),
    filesChanged: numstat.length,
    renamed: hasRename(nameStatus),
});
