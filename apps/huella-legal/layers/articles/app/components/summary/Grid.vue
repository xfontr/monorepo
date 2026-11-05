<template>
    <ul class="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        <li
            v-for="(article, index) in articles"
            :key="article.id"
            :class="index === orphan && 'md:hidden lg:block'"
        >
            <SummaryCard :article variant="media" />
        </li>
    </ul>
</template>

<script setup lang="ts">
interface Props {
    articles: ArticleSummary[];
    hideOrphan?: boolean;
}

const props = withDefaults(defineProps<Props>(), { hideOrphan: false });

const orphan = computed<number>(() =>
    props.hideOrphan && props.articles.length > 1 && props.articles.length % 2 === 1
        ? props.articles.length - 1
        : -1,
);
</script>
