import { out } from "../shared/adapters/io.ts";
import { currentBranch } from "../shared/adapters/usage.ts";
import { isCompleteLine, logFileFor, LOGS } from "../shared/domain/usage.ts";
import { appendToLog, takeBuffer } from "./adapters/files.ts";

export const main = (): void => {
    const branch = currentBranch();
    if (!branch) {
        out.info("Not on a branch — the recorded rows wait for the next flush.");
        return;
    }

    for (const { name, columns } of LOGS) {
        const buffer = takeBuffer(name);
        const lines = buffer.text.split("\n").filter((line) => isCompleteLine(line, columns));

        if (lines.length > 0) {
            const path = appendToLog(name, logFileFor(branch), columns, lines);
            out.success(`Flushed ${lines.length} rows into ${path}.`);
        }

        buffer.discard();
    }
};
