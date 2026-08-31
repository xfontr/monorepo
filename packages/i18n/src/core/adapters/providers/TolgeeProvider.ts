import { UndefinedLocaleProviderError } from "#core/domain/errors";
import type { Locale, TranslationMap } from "#core/domain/translations";
import TranslationProvider from "#core/ports/TranslationProvider";

export interface TolgeeProviderOptions {
    token: string
}

interface TolgeeTranslations {
    [locale: Locale]: TranslationMap
}

class TolgeeProvider extends TranslationProvider<TolgeeProviderOptions> {
    protected override configProblems(): string[] {
        return this.options?.token?.trim() ? [] : ["options.token is empty"];
    }

    override async getTranslations(locale: Locale): Promise<TranslationMap> {
        const response = await this.http.get<TolgeeTranslations>(
            `/v2/projects/${this.project}/translations/${locale}`,
            { headers: { "X-API-Key": this.options.token } },
        );

        if (!response[locale]) {
            throw new UndefinedLocaleProviderError(locale, "Tolgee");
        }

        return response[locale];
    }
}

export default TolgeeProvider;
