<template>
    <UPageSection
        v-if="articles.length"
        orientation="horizontal"
        :aria-labelledby="titleId"
        :description="$t('homeTheses.lead')"
        :ui="{ wrapper: 'lg:pt-4', footer: 'mt-4', links: '-ml-3' }"
        class="bg-inverted text-default surface-inverted"
    >
        <template #headline>
            <BaseKicker>{{ $t("homeTheses.kicker") }}</BaseKicker>
        </template>
        <template #title>
            <span :id="titleId">{{ $t("homeTheses.title") }}</span>
        </template>
        <template #links>
            <UButton
                variant="link"
                :label="$t('homeTheses.all')"
                trailing-icon="i-lucide-arrow-right"
                :to="{ name: 'publications', query: { format: 'tfg-tfm' } }"
                class="text-highlighted hover:text-highlighted"
            />
            <UButton
                variant="link"
                :label="$t('homeTheses.publish')"
                :to="{ name: 'publish', hash: '#tesis' }"
                class="text-huella-teal-200 hover:text-huella-teal-100"
            />
        </template>
        <ol class="grid gap-x-8 md:grid-cols-3 lg:col-span-8">
            <li
                v-for="article in articles"
                :key="article.id"
                class="relative border-t border-default py-5"
            >
                <p v-if="article.category" class="text-kicker text-secondary">
                    {{ article.category.name }}
                </p>
                <ULink
                    raw
                    :to="{ name: 'article', params: { slug: article.slug } }"
                    class="mt-2 block font-serif text-lg/snug text-highlighted underline-title after:absolute after:inset-0 hover:underline focus-visible:rounded-xs focus-visible:outline-offset-2 focus-visible:outline-ivory-50"
                    >{{ article.title }}</ULink
                >
                <p class="mt-2 font-sans text-meta text-muted">
                    <template v-if="article.authors[0]"
                        >{{ article.authors[0].name }}
                        <span aria-hidden="true">·</span>
                    </template>
                    {{ $t("homeTheses.readingTime", { minutes: article.readingMinutes }) }}
                </p>
            </li>
        </ol>
    </UPageSection>
</template>

<script setup lang="ts">
interface Props {
    articles: ArticleSummary[];
}

defineProps<Props>();

const titleId = useId();
</script>
