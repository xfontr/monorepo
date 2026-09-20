import { cancel, intro, log, note, outro, spinner as clackSpinner } from "@clack/prompts";
import process from "node:process";

/** CI and GUI Git clients lack a readable terminal, so clack decoration would pollute logs. */
export const isInteractive = (): boolean => Boolean(process.stdout.isTTY) && !process.env.CI;

const line = (stream: NodeJS.WriteStream, message: string): void => void stream.write(`${message}\n`);

/** Warnings and errors stay on stderr so check failures remain separate from stdout. */
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

    /** Non-interactive spinners print start/stop once and discard intermediate messages. */
    spinner: (): { start: (message: string) => void, stop: (message: string) => void, message: (message: string) => void } => {
        if (isInteractive()) return clackSpinner();

        return {
            start: (message: string): void => line(process.stdout, message),
            stop: (message: string): void => line(process.stdout, message),
            message: (): void => undefined,
        };
    },
};
