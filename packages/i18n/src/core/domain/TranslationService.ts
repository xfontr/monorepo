import type TranslationsProvider from "../ports/TranslationProvider";
import type { Locale, TranslationMap } from "./translations";

export class TranslationService {
    constructor(private readonly provider: TranslationsProvider) {}

    load(locale: Locale): Promise<TranslationMap> {
        return this.provider.getTranslations(locale);
    }
}
