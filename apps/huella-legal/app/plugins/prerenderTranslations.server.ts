export default defineNuxtPlugin({
    name: "prerender-translations",
    dependsOn: ["i18n:plugin:route-locale-detect"],
    setup: (nuxtApp) => {
        if (!import.meta.prerender) return;

        const { locale, getLocaleMessage } = nuxtApp.$i18n;

        if (Object.keys(getLocaleMessage(locale.value)).length) return;

        throw createError({ statusCode: 502, statusMessage: "Translations unavailable" });
    },
});
