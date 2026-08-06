import type { HttpClient } from "@budget-forecast/i18n";

export class OfetchHttpClient implements HttpClient {
    private $fetch: typeof $fetch;

    constructor(ofetchInstance: typeof $fetch) {
        this.$fetch = ofetchInstance;
    }

    get<T>(url: string): Promise<T> {
        return this.$fetch<T>(url) as Promise<T>;
    }
}
