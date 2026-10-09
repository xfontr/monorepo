<script setup lang="ts">
interface Props {
    articles: ArticleSummary[]
    variant?: "standard" | "media"
    columns?: 2 | 3
    hideOrphan?: boolean
}

const props = withDefaults(defineProps<Props>(), { variant: "media", columns: 3, hideOrphan: false });

const orphan = computed<number>(() =>
    props.hideOrphan && props.columns === 3 && props.articles.length > 1 && props.articles.length % 2 === 1 ? props.articles.length - 1 : -1,
);
</script>

<template>
    <ul
        class="grid gap-x-10 gap-y-12 md:grid-cols-2"
        :class="columns === 3 && 'lg:grid-cols-3'"
    >
        <li
            v-for="(article, index) in articles"
            :key="article.id"
            :class="index === orphan && 'md:hidden lg:block'"
        >
            <SummaryCard
                :article
                :variant
            />
        </li>
    </ul>
</template>
