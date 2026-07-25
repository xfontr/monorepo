import type { Locale, TranslationMap } from "../domain/translations";
import type { HttpClient } from "../ports/HttpClient";
import type { TranslationProvider } from "../ports/TranslationProvider";

/**
 * Adapter for `infrastructure/translations/server` (route: `/:locale/:project`).
 */
export class TranslationsServerProvider implements TranslationProvider {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpClient,
        baseUrl: string,
        private readonly project: string,
    ) {
        if (!baseUrl) throw new Error("Translations API base URL not defined");

        this.baseUrl = baseUrl.replace(/\/+$/, "");
    }

    public getTranslations(locale: Locale): Promise<TranslationMap> {
        return this.http.get<TranslationMap>(`${this.baseUrl}/${locale}/${this.project}`);
    }
}
