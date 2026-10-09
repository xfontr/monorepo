<script setup lang="ts">
interface Props {
    category: Category
    articles: ArticleSummary[]
}

defineProps<Props>();
</script>

<template>
    <section
        v-if="articles.length"
        aria-labelledby="mas-materia"
        class="border-t border-default bg-ivory-50 print:hidden"
    >
        <UContainer class="grid grid-cols-1 py-16 lg:grid-cols-12 lg:gap-x-8 lg:py-20">
            <div class="lg:col-span-9 lg:col-start-4">
                <BaseSectionHeading
                    id="mas-materia"
                    :title="$t('article.related.title', { subject: category.name })"
                    :action="{ label: $t('article.related.all'), to: { name: 'category', params: { slug: category.slug } } }"
                />
                <SummaryList
                    :articles
                    variant="row"
                />
            </div>
        </UContainer>
    </section>
</template>
