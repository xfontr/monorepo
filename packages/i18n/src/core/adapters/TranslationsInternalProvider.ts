import type { Locale, TranslationMap } from "../domain/translations";
import TranslationsProvider from "../ports/TranslationProvider";

class TranslationsServerProvider extends TranslationsProvider {
    override getTranslations(locale: Locale): Promise<TranslationMap> {
        return this.http.get<TranslationMap>(`${locale}/${this.project}`);
    }
}

export default TranslationsServerProvider;
