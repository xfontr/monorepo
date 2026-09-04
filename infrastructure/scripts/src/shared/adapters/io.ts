import { cancel, intro, log, note, outro, spinner as clackSpinner } from "@clack/prompts";
import process from "node:process";

/**
 * Whether anything watching this output can read box-drawing characters and an animated spinner.
 * `map/` is the script CI runs (`docs:map --check`), and `drift/` runs from a pre-push hook that a
 * GUI git client invokes with no terminal attached — for both, clack's decoration is noise in a log
 * someone greps later.
 */
export const isInteractive = (): boolean => Boolean(process.stdout.isTTY) && !process.env.CI;

const line = (stream: NodeJS.WriteStream, message: string): void => void stream.write(`${message}\n`);

/**
 * Anything a person is meant to read, in whichever of the two dialects fits the audience. The split
 * is not cosmetic: `warn` and `error` go to stderr in both dialects, so a `--check` failure stays
 * separable from the answer on stdout however the script was invoked.
 */
export const out = {
    info: (message: string): void =>
        isInteractive() ? log.info(message) : line(process.stdout, message),

    success: (message: string): void =>
        isInteractive() ? log.success(message) : line(process.stdout, message),

    warn: (message: string): void =>
        isInteractive() ? log.warn(message, { output: process.stderr }) : line(process.stderr, message),

    error: (message: string): void =>
        isInteractive() ? log.error(message, { output: process.stderr }) : line(process.stderr, message),

    note: (message: string, title?: string): void =>
        isInteractive() ? note(message, title) : line(process.stdout, [title, message].filter(Boolean).join("\n")),

    begin: (message: string): void =>
        isInteractive() ? intro(message) : line(process.stdout, message),

    end: (message: string): void =>
        isInteractive() ? outro(message) : line(process.stdout, message),

    cancelled: (message: string): void =>
        isInteractive() ? cancel(message) : line(process.stdout, message),

    /**
     * Non-interactively a spinner has nothing to animate, so `start`/`stop` each print their
     * message once and `message` is dropped — the intermediate states exist to show progress, and
     * replaying them into a log file is just repetition.
     */
    spinner: (): { start: (message: string) => void, stop: (message: string) => void, message: (message: string) => void } => {
        if (isInteractive()) return clackSpinner();

        return {
            start: (message: string): void => line(process.stdout, message),
            stop: (message: string): void => line(process.stdout, message),
            message: (): void => undefined,
        };
    },
};
