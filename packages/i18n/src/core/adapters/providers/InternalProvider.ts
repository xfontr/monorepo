import type { Locale, TranslationMap } from "#core/domain/translations";
import TranslationProvider from "#core/ports/TranslationProvider";

class InternalProvider extends TranslationProvider {
    override async getTranslations(locale: Locale): Promise<TranslationMap> {
        const { data } = await this.http.get<TranslationMap>(`${locale}/${this.project}`);

        return data;
    }
}

export default InternalProvider;
