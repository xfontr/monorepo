import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { git } from "../../shared/adapters/git.ts";
import { ExpectedError } from "../../shared/errors.ts";

export const currentBranch = (): string => git("rev-parse", "--abbrev-ref", "HEAD");

/** Validate the environment-provided branch before passing it as a Git argument. */
export const push = (branch: string): void => {
    try {
        git("push", "-u", "origin", assertNotFlagLike(branch, "branch"));
    }
    catch (error) {
        const stderr = (error as { stderr?: Buffer | string }).stderr?.toString().trim();
        throw new ExpectedError(
            "Push rejected — ensure the code passes the push requirements (branch name, lint, test, typecheck) before shipping."
            + (stderr ? `\n${stderr}` : ""),
        );
    }
};

export const checkoutMaster = (): void => {
    git("checkout", "master");
};

export const pullMaster = (): void => {
    git("pull", "origin", "master");
};
