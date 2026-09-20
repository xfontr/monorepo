import { isCancel } from "@clack/prompts";
import { CancelledError } from "../errors.ts";

/** Convert prompt cancellation into `CancelledError` for `run` to report. */
export const orExit = <T>(value: T | symbol, message: string): T => {
    if (isCancel(value)) throw new CancelledError(message);

    return value;
};
