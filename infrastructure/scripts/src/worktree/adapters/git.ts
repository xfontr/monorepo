import { git } from "../../shared/adapters/git.ts";
import { isEnvFile } from "../domain/worktree.ts";

export const worktreeList = (): string => git("worktree", "list", "--porcelain");

export const envFiles = (root: string): string[] =>
    git(
        "-C",
        root,
        "ls-files",
        "--others",
        "--ignored",
        "--exclude-standard",
        "--",
        ":(glob)**/.env",
        ":(glob)**/.env.*",
    )
        .split("\n")
        .filter(isEnvFile);
