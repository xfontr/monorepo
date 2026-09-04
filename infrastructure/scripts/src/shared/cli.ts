import { relative } from "node:path";
import process from "node:process";
import { CancelledError, ExpectedError } from "./errors.ts";
import { out } from "./io.ts";

export type Args = {
    flags: ReadonlySet<string>
    positionals: string[]
};

export type Command = (args: Args) => void | Promise<void>;

const parse = (argv: string[]): Args => ({
    flags: new Set(argv.filter((arg) => arg.startsWith("--")).map((arg) => arg.slice(2))),
    positionals: argv.filter((arg) => !arg.startsWith("--")),
});

/**
 * Read per call rather than parsed once into a module-level const, so importing a module can't
 * freeze the answer before the command that cares about it runs.
 */
export const flag = (name: string): boolean => process.argv.includes(`--${name}`);

/**
 * `process.exitCode` rather than `process.exit`: writes to a pipe are asynchronous in Node, so
 * exiting on the line after a write can truncate it — `pnpm docs:map --check | tee log` did.
 */
export const fail = (message: string): void => {
    out.error(message);
    process.exitCode = 1;
};

/**
 * How this process was invoked, so the usage line names the file the reader would actually run —
 * relative, since `pnpm --filter` puts cwd at this package's root and `node src/issue/index.ts` is
 * what they'd type. An entry point outside cwd falls back to its absolute path rather than printing
 * a ladder of `../`.
 */
const invocation = (): string => {
    const entry = process.argv[1] ?? "";
    const path = relative(process.cwd(), entry);
    return `node ${path && !path.startsWith("..") ? path : entry}`;
};

/**
 * `execFileSync`'s own message is only the command line it ran; what `git` or `gh` said about why
 * it refused is in `stderr`, and that's the half that names the problem.
 */
const detailOf = (error: unknown): string | undefined =>
    (error as { stderr?: Buffer | string }).stderr?.toString().trim() || undefined;

const report = (error: unknown): void => {
    if (error instanceof CancelledError) {
        out.cancelled(error.message);
        return;
    }

    if (error instanceof ExpectedError) {
        fail(error.message);
        return;
    }

    // Everything else is a bug in here, so the stack is the useful part rather than noise.
    const stack = error instanceof Error ? error.stack ?? error.message : String(error);
    const detail = detailOf(error);
    fail(detail ? `${stack}\n${detail}` : stack);
};

/**
 * The body of every entry point, so all of them agree on what an exit code means and none of them
 * has to repeat the argv parsing. One command runs unconditionally; several dispatch on the first
 * positional, which is what replaces a hand-written dispatch table.
 */
export const run = async (commands: Command | Record<string, Command>): Promise<void> => {
    const args = parse(process.argv.slice(2));

    try {
        if (typeof commands === "function") {
            await commands(args);
            return;
        }

        const [name, ...rest] = args.positionals;
        const command = name === undefined ? undefined : commands[name];

        if (!command) {
            fail(`Usage: ${invocation()} <${Object.keys(commands).join("|")}>`);
            return;
        }

        await command({ ...args, positionals: rest });
    }
    catch (error) {
        report(error);
    }
};
