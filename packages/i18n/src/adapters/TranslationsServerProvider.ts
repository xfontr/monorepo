import type { Locale, TranslationMap } from "../domain/translations";
import type { HttpClient } from "../ports/HttpClient";
import type { TranslationProvider } from "../ports/TranslationProvider";

/**
 * Adapter for `infrastructure/translations/server` (route: `/:locale/:project`).
 */
export class TranslationsServerProvider implements TranslationProvider {
    constructor(
        private readonly http: HttpClient,
        private readonly project: string,
    ) {}

    public getTranslations(locale: Locale): Promise<TranslationMap> {
        return this.http.get<TranslationMap>(`${locale}/${this.project}`);
    }
}
