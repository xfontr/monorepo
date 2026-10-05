<script setup lang="ts">
const { t, localeProperties } = useI18n();

useHead({
    meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    htmlAttrs: { lang: () => localeProperties.value.language },
});

useSeoMeta({
    title: t("app.title"),
    description: t("app.description"),
    ogTitle: t("app.title"),
    ogDescription: t("app.description"),
});
</script>

<template>
    <div class="flex min-h-dvh flex-col">
        <a
            href="#contenido"
            class="sr-only z-50 rounded-xs bg-primary font-sans text-sm font-semibold text-inverted focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >{{ $t("app.skipLink") }}</a>

        <ShellSiteHeader />

        <UMain
            id="contenido"
            tabindex="-1"
            class="min-h-0 flex-1 outline-none"
        >
            <slot />
        </UMain>

        <ShellSiteFooter />
    </div>
</template>
