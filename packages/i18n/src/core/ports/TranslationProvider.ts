import type { Locale, TranslationMap } from "../domain/translations";
import type { HttpClient } from "./HttpClient";

export interface TranslationProvider {
    getTranslations(locale: Locale): Promise<TranslationMap>
    setHttpClient(http: HttpClient): this
}
