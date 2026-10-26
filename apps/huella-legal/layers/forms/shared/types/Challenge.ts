/** `FormChallenge`'s slot prop: waits for a single-use Turnstile token and hands it to `send`. */
export type Challenge = <T>(send: (token: string) => Promise<T>) => Promise<T>;
