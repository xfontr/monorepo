import { resolve } from "node:path";
import process from "node:process";
import { out } from "../shared/adapters/io.ts";
import type { Args } from "../shared/cli.ts";
import { excerpt } from "../shared/domain/logs.ts";
import { ExpectedError } from "../shared/errors.ts";
import { canonical, copyMissing, isInstalled } from "./adapters/files.ts";
import { envFiles, worktreeList } from "./adapters/git.ts";
import { install } from "./adapters/pnpm.ts";
import { parseWorktrees, preparedLine } from "./domain/worktree.ts";

const usage = (unprepared: string[]): string =>
    [
        "Name the worktree: pnpm worktree:prepare <path>",
        ...(unprepared.length > 0
            ? ["Linked worktrees with no node_modules:", ...unprepared.map((path) => `  ${path}`)]
            : ["Every linked worktree already has node_modules."]),
    ].join("\n");

export const main = ({ positionals }: Args): void => {
    const [primary, ...linked] = parseWorktrees(worktreeList());
    if (!primary) throw new ExpectedError("git worktree list printed nothing.");

    const [requested] = positionals;
    if (!requested) {
        throw new ExpectedError(
            usage(linked.map(({ path }) => path).filter((path) => !isInstalled(path))),
        );
    }

    // pnpm runs this from the package directory, and INIT_CWD is where the command was typed.
    const path = canonical(resolve(process.env.INIT_CWD ?? process.cwd(), requested));
    const target = linked.find((tree) => canonical(tree.path) === path);
    if (!target) throw new ExpectedError(`${path} is not a linked worktree of this repository.`);

    const copied = copyMissing(primary.path, target.path, envFiles(primary.path));

    const { status, stdout, stderr } = install(target.path);
    if (status !== 0) {
        throw new ExpectedError(
            [
                `pnpm install failed in ${target.path}:`,
                ...excerpt(`${stdout}\n${stderr}`).lines,
            ].join("\n"),
        );
    }

    out.success(preparedLine(target.path, copied));
};
