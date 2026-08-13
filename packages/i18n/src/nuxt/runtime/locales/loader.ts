import type { TranslationMap } from "#core/domain/translations";
import { TRANSLATIONS_API_PATH } from "#nuxt/config";

export default defineI18nLocale((locale) => $fetch<TranslationMap>(`${TRANSLATIONS_API_PATH}/${locale}`));
