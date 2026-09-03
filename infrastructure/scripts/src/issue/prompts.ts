import { cancel, isCancel } from "@clack/prompts";
import process from "node:process";

// Every prompt goes through here so a Ctrl+C anywhere exits quietly, instead of each step
// having to thread a cancelled/not-cancelled state back up.
export const orExit = <T>(value: T | symbol, message: string): T => {
    if (isCancel(value)) {
        cancel(message);
        process.exit(0);
    }

    return value;
};

export const NONE = "";
