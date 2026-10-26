<script setup lang="ts">
definePageMeta({ name: "article", path: "/:slug/" });

const route = useRoute("article");
const isPage = useRuntimeConfig().public.pageSlugs.includes(route.params.slug);
</script>

<template>
    <PageView v-if="isPage" />
    <div v-else>
        <ArticleView />
        <NewsletterBand class="print:hidden" />
    </div>
</template>
