import { FetchError, type $Fetch } from "ofetch";
import { UpstreamError } from "#core/domain/errors";
import type { HttpClient, HttpResponse, RequestOptions } from "#core/ports/HttpClient";

const JSON_CONTENT_TYPE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json$/i;

const isJson = (contentType: string | null): boolean =>
    !contentType || JSON_CONTENT_TYPE.test(contentType.split(";")[0]!.trim());

const rethrowAsUpstreamError = (cause: unknown): never => {
    throw new UpstreamError(
        cause instanceof FetchError ? cause.response?.status : undefined,
        cause,
    );
};

export class OfetchHttpClient implements HttpClient {
    constructor(private readonly $fetch: $Fetch) {}

    public async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
        const response = await this.$fetch
            .raw<T>(url, {
                headers: options?.headers,
                query: options?.query,
            })
            .catch(rethrowAsUpstreamError);

        const contentType = response.headers.get("content-type");

        if (!isJson(contentType)) {
            throw new UpstreamError(
                response.status,
                new Error(
                    `Expected JSON from ${url}, got ${contentType} (${response.status}): ` +
                        String(response._data).slice(0, 300),
                ),
            );
        }

        return { data: response._data as T, headers: response.headers };
    }
}
