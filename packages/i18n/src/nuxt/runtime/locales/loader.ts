import type { TranslationMap } from "../../../core/domain/translations";
import { TRANSLATIONS_API_PATH } from "../../shared";

export default defineI18nLocale(async (locale) => {
    const nuxtApp = useNuxtApp();

    const { data, error } = await useFetch<TranslationMap>(`${TRANSLATIONS_API_PATH}/${locale}`, {
        key: `translations:${locale}`,
    });

    if (error.value) {
        nuxtApp.runWithContext(() => showError(error.value!));
    }

    return data.value!;
});
