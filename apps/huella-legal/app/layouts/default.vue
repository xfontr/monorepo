<script setup lang="ts">
const { t, localeProperties } = useI18n();
const { sections, columns, social, issn } = useSiteNav();
const {
    public: { site },
} = useRuntimeConfig();
const { journal } = useAppConfig();

useHead({
    htmlAttrs: { lang: () => localeProperties.value.language },
    link: [
        {
            rel: "alternate",
            type: "application/rss+xml",
            title: journal.name,
            href: new URL("/feed/", site.url).href,
        },
    ],
});

useSeoMeta({
    title: t("app.title"),
    description: t("app.description"),
    // A page without its own og:image (everything but an article) falls back to this.
    ogImage: new URL("/og-image.png", site.url).href,
    ogImageWidth: 1200,
    ogImageHeight: 630,
});
</script>

<template>
    <div class="flex min-h-dvh flex-col">
        <a
            href="#contenido"
            class="sr-only z-50 rounded-xs bg-primary font-sans text-sm font-semibold text-inverted focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-3"
            >{{ $t("app.skipLink") }}</a
        >

        <ShellSiteHeader :sections :issn />

        <UMain id="contenido" tabindex="-1" class="min-h-0 flex-1 outline-none">
            <slot />
        </UMain>

        <ShellSiteFooter :columns :social :issn />
    </div>
</template>
