<script setup lang="ts">
definePageMeta({ name: "article", path: "/:slug/" });

const { article, related } = await useArticle();
</script>

<template>
    <article v-if="article">
        <ArticleHeader :article />

        <UContainer class="grid grid-cols-1 pt-10 pb-16 md:pt-12 lg:grid-cols-12 lg:gap-x-8 lg:pb-20">
            <ArticleToc
                :items="article.body.toc"
                class="mb-10 lg:col-span-3 lg:mb-0"
            />

            <div class="min-w-0 lg:col-span-9">
                <ArticleProse
                    :lead="article.body.lead"
                    :html="article.body.html"
                    :image="article.image"
                />
                <ArticleBackMatter
                    :article
                    class="mt-12 lg:mt-16"
                />
            </div>
        </UContainer>

        <ArticleRelated
            v-if="article.category"
            :category="article.category"
            :articles="related"
        />
    </article>
</template>
