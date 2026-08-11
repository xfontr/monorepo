import type { $Fetch } from "nitropack";
import type { HttpClient } from "../ports/HttpClient";

export class OfetchHttpClient implements HttpClient {
    constructor(private readonly $fetch: $Fetch) {}

    public get<T>(url: string): Promise<T> {
        return this.$fetch<T>(url);
    }
}
