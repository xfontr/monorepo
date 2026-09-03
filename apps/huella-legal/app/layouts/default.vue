<script setup lang="ts">
const { t, locale } = useI18n();

useHead({
    meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    htmlAttrs: { lang: locale },
});

useSeoMeta({
    title: t("meta.title"),
    description: t("meta.description"),
    ogTitle: t("meta.title"),
    ogDescription: t("meta.description"),
});
</script>

<template>
    <slot />
</template>
