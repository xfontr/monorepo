<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import { FORMAT_KEYS } from "#layers/articles/app/constants";

interface Props {
    article: Article;
}

const props = defineProps<Props>();

const { t } = useI18n();

const breadcrumb = computed<BreadcrumbItem[]>(() => {
    const category = props.article.category;
    const items: BreadcrumbItem[] = [
        { label: t("article.breadcrumb.home"), to: { name: "index" } },
        { label: t("article.breadcrumb.publications"), to: { name: "publications" } },
    ];

    return category
        ? [
              ...items,
              { label: category.name, to: { name: "category", params: { slug: category.slug } } },
          ]
        : items;
});

const formatLabel = computed<string>(() =>
    t(`article.formats.${FORMAT_KEYS[props.article.format]}`),
);

const bylineAuthors = computed(() =>
    props.article.authors.map((author) => ({ ...author, to: { hash: "#autor" } })),
);
</script>

<template>
    <ArticleTitle :breadcrumb :title="article.title">
        <template #kicker>
            <p class="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs md:mt-8">
                <BaseKicker>{{ formatLabel }}</BaseKicker>
                <template v-if="article.category">
                    <span class="text-dimmed" aria-hidden="true">·</span>
                    <ULink
                        :to="{ name: 'category', params: { slug: article.category.slug } }"
                        raw
                        class="font-medium text-muted underline-offset-4 hover:underline"
                    >
                        {{ article.category.name }}
                    </ULink>
                </template>
            </p>
        </template>

        <p
            v-if="article.excerpt"
            class="mt-6 max-w-measure border-y border-default py-5 font-serif text-standfirst text-toned italic md:text-standfirst-lg"
        >
            {{ article.excerpt }}
        </p>

        <div
            class="mt-5 flex max-w-measure flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
            <Byline
                :authors="bylineAuthors"
                :published-at="article.publishedAt"
                :reading-minutes="article.readingMinutes"
                avatars
            />
            <ArticleShareBar
                :title="article.title"
                :url="article.permalink"
                :cite-to="{ hash: '#citar' }"
                class="-ml-3 sm:-mr-3 sm:ml-0"
            />
        </div>
    </ArticleTitle>
</template>
