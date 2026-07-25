import type { HttpClient } from "@budget-forecast/i18n";

export class OfetchHttpClient implements HttpClient {
    get<T>(url: string): Promise<T> {
        return $fetch<T>(url);
    }
}
