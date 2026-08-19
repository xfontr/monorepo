import { FetchError, type $Fetch } from "ofetch";
import { UpstreamError } from "#core/domain/errors";
import type { HttpClient, HttpResponse, RequestOptions } from "#core/ports/HttpClient";

export class OfetchHttpClient implements HttpClient {
    constructor(private readonly $fetch: $Fetch) {}

    public async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
        const response = await this.$fetch
            .raw<T>(url, {
                headers: options?.headers,
                query: options?.query,
            })
            .catch(rethrowAsUpstreamError);

        return { data: response._data as T, headers: response.headers };
    }
}

function rethrowAsUpstreamError(cause: unknown): never {
    throw new UpstreamError(cause instanceof FetchError ? cause.response?.status : undefined, cause);
}
