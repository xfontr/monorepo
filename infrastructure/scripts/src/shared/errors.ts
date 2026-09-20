/** The CLI prints this message without a stack trace for expected user-facing failures. */
export class ExpectedError extends Error {}

/** A prompt answered with Ctrl+C or escape. Not a failure: `run` reports it and exits 0. */
export class CancelledError extends Error {}
