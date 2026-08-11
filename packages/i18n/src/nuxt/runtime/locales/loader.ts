import { createError } from "h3";
import type { TranslationMap } from "../../../domain/translations";
import { TRANSLATIONS_API_PATH } from "../../shared";

export default defineI18nLocale(async (locale) => {
    const { data, error } = await useFetch<TranslationMap>(`${TRANSLATIONS_API_PATH}/${locale}`, {
        key: `translations:${locale}`,
    });

    if (error.value) {
        throw createError(error.value);
    }

    return data.value!;
});
