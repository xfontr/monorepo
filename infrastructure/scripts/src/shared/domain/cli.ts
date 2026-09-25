import { relative } from "node:path";
import { CancelledError, ExpectedError } from "../errors.ts";

export type Args = {
    flags: ReadonlySet<string>
    positionals: string[]
};

export type ErrorReport = {
    cancelled: boolean
    message: string
};

type MatchedDispatch<T> = {
    matched: true
    command: T
    args: {
        flags: ReadonlySet<string>
        positionalsWithoutCommandName: string[]
    }
};

type UnmatchedDispatch = {
    matched: false
    usage: string
};

export type Dispatch<T> = MatchedDispatch<T> | UnmatchedDispatch;

export const parse = (argv: string[]): Args => ({
    flags: new Set(argv.filter((arg) => arg.startsWith("--")).map((arg) => arg.slice(2))),
    positionals: argv.filter((arg) => !arg.startsWith("--")),
});

export const dispatch = <T>(commands: Record<string, T>, args: Args, commandInvocation: string): Dispatch<T> => {
    const [name, ...positionalsWithoutCommandName] = args.positionals;
    const command = name === undefined ? undefined : commands[name];

    if (!command) return {
        matched: false,
        usage: `Usage: ${commandInvocation} <${Object.keys(commands).join("|")}>`,
    };

    return {
        matched: true,
        command,
        args: { flags: args.flags, positionalsWithoutCommandName },
    };
};

export const invocation = (entry: string, cwd: string): string => {
    const path = relative(cwd, entry);
    return `node ${path && !path.startsWith("..") ? path : entry}`;
};

const detailOf = (error: unknown): string | undefined =>
    (error as { stderr?: Buffer | string }).stderr?.toString().trim() || undefined;

export const report = (error: unknown): ErrorReport => {
    if (error instanceof CancelledError) return { cancelled: true, message: error.message };
    if (error instanceof ExpectedError) return { cancelled: false, message: error.message };

    const stack = error instanceof Error ? error.stack ?? error.message : String(error);
    const detail = detailOf(error);
    // Node already appends stderr to an execFileSync error's message, and so to its stack.
    return { cancelled: false, message: detail && !stack.includes(detail) ? `${stack}\n${detail}` : stack };
};
