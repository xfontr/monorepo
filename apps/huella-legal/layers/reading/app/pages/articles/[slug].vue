<template>
    <PageView v-if="isPage" />
    <div v-else>
        <ArticleView>
            <template #comments="{ article, comments }">
                <CommentsSection :article :comments />
            </template>
        </ArticleView>
        <NewsletterBand class="print:hidden" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ name: "article", path: "/:slug/" });

const route = useRoute("article");
const isPage = useRuntimeConfig().public.pageSlugs.includes(route.params.slug.toLowerCase());
</script>
