import { dirname, join } from "node:path";
import { out } from "../shared/adapters/io.ts";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { examplePaths, readOptional, readText, writeEnv } from "./adapters/files.ts";
import { parseEnv, render } from "./domain/envFile.ts";
import { describeSync, lostData, syncEnv } from "./domain/sync.ts";

type Outcome = "unchanged" | "stale" | "written" | "refused";

const syncOne = (example: string, check: boolean): Outcome => {
    const env = join(dirname(example), ".env");
    const refuse = (why: string): Outcome => {
        out.error(`${env} left untouched: ${why}.`);
        return "refused";
    };

    const parsedExample = parseEnv(readText(example));
    if (parsedExample.problem !== undefined) {
        return refuse(`${example} can't be read, ${parsedExample.problem}`);
    }

    const before = readOptional(env);
    const parsedEnv = before === null ? { lines: [] } : parseEnv(before);
    if (parsedEnv.problem !== undefined) return refuse(`it can't be read, ${parsedEnv.problem}`);

    const synced = syncEnv(parsedExample.lines, parsedEnv.lines);
    const after = render(synced.lines);
    if (after === before) return "unchanged";

    const lost = lostData(parsedEnv.lines, parsedExample.lines, after);
    if (lost.length > 0) return refuse(`syncing would lose data (${lost.join("; ")})`);

    const summary = before === null ? `created from ${example}` : describeSync(synced);

    if (check) {
        out.warn(`${env} is out of sync: ${summary}.`);
        return "stale";
    }

    const backup = writeEnv(env, after);
    const backupNote = backup ? ` Backup at ${backup}.` : "";
    out.success(`${env}: ${summary}.${backupNote}`);
    return "written";
};

export const main = ({ flags }: Args): void => {
    const check = flags.has("check");
    const examples = examplePaths();
    const outcomes = examples.map((example) => syncOne(example, check));

    const refused = outcomes.filter((outcome) => outcome === "refused").length;
    if (refused > 0) {
        throw new ExpectedError(
            `${refused} env file${refused === 1 ? "" : "s"} left untouched — see above.`,
        );
    }

    if (outcomes.includes("stale")) {
        throw new ExpectedError("Run `pnpm env:sync` to bring them in line.");
    }

    if (!outcomes.includes("written")) {
        out.success(`${examples.length} .env files match their .env.example.`);
    }
};
