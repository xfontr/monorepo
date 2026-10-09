<script setup lang="ts">
interface Props {
    article: Article
}

const props = defineProps<Props>();

const tagNames = computed<string>(() => props.article.tags.map(({ name }) => name).join(" · "));
</script>

<template>
    <div class="flex max-w-measure flex-col gap-12">
        <ArticleNotes :notes="article.body.notes" />
        <ArticleBibliography :entries="article.body.bibliography" />

        <div id="citar">
            <CiteBox :citations="article.citations" />
        </div>

        <p
            v-if="article.tags.length"
            class="font-sans text-sm text-muted print:hidden"
        >
            <span class="mr-1 font-semibold text-highlighted">{{ $t("article.tags") }}</span>
            {{ tagNames }}
        </p>

        <div
            id="autor"
            class="flex flex-col gap-12"
        >
            <AuthorCard
                v-for="author in article.authors"
                :key="author.id"
                :author
                :to="{ name: 'author', params: { slug: author.slug } }"
            />
        </div>
    </div>
</template>
