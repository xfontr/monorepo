import type { Locale, TranslationMap } from "#core/domain/translations";
import TranslationProvider from "#core/ports/TranslationProvider";

export interface TestProviderOptions {
    id: string
}

class TestProvider extends TranslationProvider<TestProviderOptions> {
    override getTranslations(locale: Locale): Promise<TranslationMap> {
        return this.http.get<TranslationMap>(`${locale}/${this.project}/${this.options.id}`);
    }
}

export default TestProvider;
