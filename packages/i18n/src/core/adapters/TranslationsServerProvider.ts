import assert from "node:assert";
import type { Locale, TranslationMap } from "../domain/translations";
import type { HttpClient } from "../ports/HttpClient";
import type { TranslationProvider } from "../ports/TranslationProvider";

/**
 * Adapter for `infrastructure/translations/server` (route: `/:locale/:project`).
 */
class TranslationsServerProvider implements TranslationProvider {
    private http?: HttpClient;

    constructor(private readonly project: string) {}

    public getTranslations(locale: Locale): Promise<TranslationMap> {
        assert(this.http, "HTTP Client not defined");
        return this.http.get<TranslationMap>(`${locale}/${this.project}`);
    }

    public setHttpClient(http: HttpClient): this {
        this.http = http;
        return this;
    }
}

export default TranslationsServerProvider;
