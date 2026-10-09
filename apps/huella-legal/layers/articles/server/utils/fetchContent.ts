import { ContentRouteError } from "../errors";

export function fetchContent<T>(path: string, options?: { query?: Record<string, unknown> }): Promise<T> {
    return $fetch<unknown, string>(path, options).then(
        (data) => data as T,
        (cause: unknown) => {
            throw new ContentRouteError(cause);
        },
    );
}
