import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const saveLog = (job: string, text: string): string => {
    const path = join(tmpdir(), `monorepo-ci-job-${job}.log`);
    writeFileSync(path, text);
    return path;
};
