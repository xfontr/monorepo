import type { Locale, TranslationMap } from "../domain/translations";
import type { TranslationProvider } from "../ports/TranslationProvider";

export class TranslationService {
    constructor(private readonly provider: TranslationProvider) {}

    load(locale: Locale): Promise<TranslationMap> {
        return this.provider.getTranslations(locale);
    }
}
