<script setup lang="ts">
const { article, related, authorCounts, comments } = await useArticle();

useScholarlyMeta(article);
</script>

<template>
    <article v-if="article">
        <ArticleHeader :article :comment-count="comments?.count" />

        <UContainer class="grid grid-cols-1 pt-10 pb-12 md:pt-12 lg:grid-cols-12 lg:gap-x-8">
            <ArticleToc :items="article.body.toc" class="mb-10 lg:col-span-3 lg:mb-0" />

            <div class="min-w-0 lg:col-span-9">
                <ArticleProse
                    :lead="article.body.lead"
                    :html="article.body.html"
                    :image="article.image"
                />
                <ArticleBackMatter :article :author-counts class="mt-12 lg:mt-16" />
            </div>
        </UContainer>

        <UContainer class="grid grid-cols-1 pb-16 lg:grid-cols-12 lg:gap-x-8 lg:pb-20">
            <CommentsSection :article :comments class="min-w-0 lg:col-span-9 lg:col-start-4" />
        </UContainer>

        <ArticleRelated v-if="article.category" :category="article.category" :articles="related" />
    </article>
</template>
