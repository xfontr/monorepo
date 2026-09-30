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
    <slot />
</template>
