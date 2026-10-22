import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { gh } from "../../shared/adapters/gh.ts";
import { detailOf } from "../../shared/domain/cli.ts";
import { ExpectedError } from "../../shared/errors.ts";
import type { Check } from "../domain/checks.ts";

/** No PR argument means the current branch's PR, which is how `gh` itself defaults. */
const prArgs = (pr: string | undefined): string[] => (pr ? [assertNotFlagLike(pr, "PR")] : []);

const ask = (args: string[]): string => {
    try {
        return gh(...args);
    } catch (error) {
        throw new ExpectedError(detailOf(error) ?? String(error));
    }
};

export const prTitle = (pr: string | undefined): string =>
    ask([
        "pr",
        "view",
        ...prArgs(pr),
        "--json",
        "number,title",
        "--jq",
        '"#\\(.number) \\(.title)"',
    ]);

/** With `--json`, `gh pr checks` exits 0 whatever the checks concluded. */
export const prChecks = (pr: string | undefined): Check[] =>
    JSON.parse(
        ask([
            "pr",
            "checks",
            ...prArgs(pr),
            "--json",
            "name,bucket,state,link,workflow,description",
        ]),
    ) as Check[];

export const failedLog = (run: string, job: string): string =>
    ask(["run", "view", run, "--job", job, "--log-failed"]);
