export default defineI18nLocale((locale) => {
    const { tmsBaseUrl } = useRuntimeConfig().public;
    return $fetch(`${tmsBaseUrl}/v1/projects/external/locales/${locale}`);
});
