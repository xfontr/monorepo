import type { Locale, TranslationMap } from "../domain/translations";
import TranslationProvider from "../ports/TranslationProvider";

export interface TestConfigProvider {
    id: string
}

class TestProvider extends TranslationProvider<TestConfigProvider> {
    override getTranslations(locale: Locale): Promise<TranslationMap> {
        return this.http.get<TranslationMap>(`${locale}/${this.project}/${this.options.id}`);
    }
}

export default TestProvider;
