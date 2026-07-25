import { TranslationService, TranslationsServerProvider } from "@budget-forecast/i18n";
import { OfetchHttpClient } from "../adapters/ofetchHttpClient";

export default defineI18nLocale((locale) => {
    const { tmsBaseUrl } = useRuntimeConfig().public;

    const provider = new TranslationsServerProvider(new OfetchHttpClient(), tmsBaseUrl, "external");
    const service = new TranslationService(provider);

    return service.load(locale);
});
