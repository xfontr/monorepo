import { isCancel, type CANCEL_SYMBOL } from "@clack/prompts";
import { CancelledError } from "../errors.ts";

export type Cancellable<T> = T | typeof CANCEL_SYMBOL;

/** Convert prompt cancellation into `CancelledError` for `run` to report. */
export const orExit = <T>(value: Cancellable<T>, message: string): T => {
    if (isCancel(value)) throw new CancelledError(message);

    return value;
};
