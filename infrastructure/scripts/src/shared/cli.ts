import process from "node:process";
import { out } from "./adapters/io.ts";
import { invocation, parse, report as classifyError, type Args } from "./domain/cli.ts";

export type { Args } from "./domain/cli.ts";

export type Command = (args: Args) => void | Promise<void>;

/** Read per call so importing a module cannot freeze the flag's value. */
export const flag = (name: string): boolean => process.argv.includes(`--${name}`);

// `pnpm docs:map --check | tee log` truncated with `process.exit` — a write to a pipe is async in Node.
export const fail = (message: string): void => {
    out.error(message);
    process.exitCode = 1;
};

const report = (error: unknown): void => {
    const result = classifyError(error);
    if (result.cancelled) {
        out.cancelled(result.message);
        return;
    }

    fail(result.message);
};

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
            fail(`Usage: ${invocation(process.argv[1] ?? "", process.cwd())} <${Object.keys(commands).join("|")}>`);
            return;
        }

        await command({ ...args, positionals: rest });
    }
    catch (error) {
        report(error);
    }
};
