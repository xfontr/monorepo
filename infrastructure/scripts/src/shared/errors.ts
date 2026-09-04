/**
 * A failure with no bug behind it, whose message already says what to do about it — a coverage
 * report that was never generated, an output `nx.json` doesn't declare. [`cli.ts`](./cli.ts) prints
 * the message on its own, because a stack trace above it buries the one line that matters.
 */
export class ExpectedError extends Error {}

/** A prompt answered with Ctrl+C or escape. Not a failure: `run` reports it and exits 0. */
export class CancelledError extends Error {}
