import { isCancel } from "@clack/prompts";
import { CancelledError } from "./errors.ts";

/**
 * Every prompt goes through here so a Ctrl+C anywhere unwinds to [`run`](./cli.ts) — which reports
 * it and exits 0 — instead of each step having to thread a cancelled/not-cancelled state back up.
 */
export const orExit = <T>(value: T | symbol, message: string): T => {
    if (isCancel(value)) throw new CancelledError(message);

    return value;
};
