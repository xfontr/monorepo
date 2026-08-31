import { FetchError, type $Fetch } from "ofetch";
import { UpstreamError } from "#core/domain/errors";
import type { HttpClient } from "#core/ports/HttpClient";

export class OfetchHttpClient implements HttpClient {
    constructor(private readonly $fetch: $Fetch) {}

    public get<T>(url: string, options?: { headers: Record<string, string> }): Promise<T> {
        return this.$fetch<T>(url, {
            headers: options?.headers,
        }).catch(rethrowAsUpstreamError);
    }
}

function rethrowAsUpstreamError(cause: unknown): never {
    throw new UpstreamError(cause instanceof FetchError ? cause.response?.status : undefined, cause);
}
