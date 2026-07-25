import type { Locale, TranslationMap } from "../domain/translations";

export interface TranslationProvider {
    getTranslations(locale: Locale): Promise<TranslationMap>
}
