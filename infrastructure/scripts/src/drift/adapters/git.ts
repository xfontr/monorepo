import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { at, git } from "../../shared/adapters/git.ts";

/** Validate refs before joining them into `base..head`, or a leading `-` can evade the check. */
const range = (base: string, head: string): string =>
    `${assertNotFlagLike(base, "base")}..${assertNotFlagLike(head, "head")}`;

export const mergeBase = (ref: string): string => git("merge-base", "HEAD", assertNotFlagLike(ref, "ref"));

export const changedFiles = (base: string, head: string): string[] =>
    git("diff", "--name-only", range(base, head)).split("\n").filter(Boolean);

export const diffNumstat = (base: string, head: string, root: string): string[] =>
    git("diff", "--numstat", range(base, head), "--", at(root)).split("\n").filter(Boolean);

export const diffNameStatus = (base: string, head: string, root: string): string[] =>
    git("diff", "--name-status", range(base, head), "--", at(root)).split("\n").filter(Boolean);

export const diffText = (base: string, head: string, root: string): string =>
    git("diff", range(base, head), "--", at(root));

/** `:(glob)` enables `**` for this pathspec; empty output means the root has no markdown history. */
export const lastMdCommitEpochSeconds = (root: string): string =>
    git("log", "-1", "--format=%ct", "--", `:(glob)${at(root)}/**/*.md`);
