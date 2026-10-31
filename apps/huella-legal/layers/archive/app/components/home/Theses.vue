<script setup lang="ts">
interface Props {
    articles: ArticleSummary[];
}

defineProps<Props>();

const titleId = useId();
</script>

<template>
    <UPageSection
        v-if="articles.length"
        orientation="horizontal"
        :aria-labelledby="titleId"
        :description="$t('homeTheses.lead')"
        :ui="{
            wrapper: 'lg:pt-4',
            title: 'text-ivory-50',
            description: 'text-huella-slate-200',
            footer: 'mt-4',
            links: '-ml-3',
        }"
        class="bg-huella-slate-900 text-huella-slate-200"
    >
        <template #headline>
            <BaseKicker tone="slate">{{ $t("homeTheses.kicker") }}</BaseKicker>
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
                class="text-ivory-50 hover:text-ivory-50"
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
                class="relative border-t border-huella-slate-700 py-5"
            >
                <p v-if="article.category" class="text-kicker text-huella-teal-300">
                    {{ article.category.name }}
                </p>
                <ULink
                    raw
                    :to="{ name: 'article', params: { slug: article.slug } }"
                    class="mt-2 block font-serif text-lg/snug text-ivory-50 decoration-huella-slate-500 underline-offset-[0.2em] after:absolute after:inset-0 hover:underline focus-visible:rounded-xs focus-visible:outline-offset-2 focus-visible:outline-ivory-50"
                    >{{ article.title }}</ULink
                >
                <p class="mt-2 font-sans text-meta text-huella-slate-300">
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
