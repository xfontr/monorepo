import type { TranslationMap } from "@budget-forecast/i18n";
import { TRANSLATIONS_API_PATH } from "../config";

export default defineI18nLocale(async (locale) => {
    const { data, error } = await useFetch<TranslationMap>(`${TRANSLATIONS_API_PATH}/${locale}`);

    if (error.value) throw createError(error.value);

    return data.value;
});
