import type { Locale, TranslationMap } from "../../domain/translations";
import TranslationProvider from "../../ports/TranslationProvider";

class InternalProvider extends TranslationProvider {
    override getTranslations(locale: Locale): Promise<TranslationMap> {
        return this.http!.get<TranslationMap>(`${locale}/${this.project}`);
    }
}

export default InternalProvider;
