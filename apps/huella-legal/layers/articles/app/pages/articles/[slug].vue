<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";

definePageMeta({ name: "article", path: "/:slug/" });

const FORMAT_KEYS = {
    "articulo": "article.formats.article",
    "comentario": "article.formats.comment",
    "ensayo": "article.formats.essay",
    "tfg-tfm": "article.formats.thesis",
} as const satisfies Record<ArticleSummary["format"], string>;

const { t } = useI18n();
const { article, related } = await useArticle();

const breadcrumb = computed<BreadcrumbItem[]>(() => {
    const category = article.value?.category;
    const items: BreadcrumbItem[] = [
        { label: t("article.breadcrumb.home"), to: { name: "index" } },
        { label: t("article.breadcrumb.publications"), to: { name: "publications" } },
    ];

    return category ? [...items, { label: category.name, to: { name: "category", params: { slug: category.slug } } }] : items;
});

const tagNames = computed(() => article.value?.tags.map(({ name }) => name).join(" · "));

const bylineAuthors = computed(() => article.value?.authors.map((author) => ({ ...author, to: { hash: "#autor" } })) ?? []);

useSeoMeta({
    title: () => article.value?.seo?.title ?? article.value?.title,
    description: () => article.value?.seo?.description ?? article.value?.excerpt,
    ogTitle: () => article.value?.seo?.title ?? article.value?.title,
    ogDescription: () => article.value?.seo?.description ?? article.value?.excerpt,
    ogType: "article",
    ogImage: () => article.value?.image?.url,
    ogImageAlt: () => article.value?.image?.alt,
    articlePublishedTime: () => article.value?.publishedAt,
    articleModifiedTime: () => article.value?.updatedAt,
    robots: () => article.value?.seo?.noindex ? "noindex" : undefined,
});
</script>

<template>
    <article v-if="article">
        <header class="mx-auto grid max-w-site grid-cols-1 px-4 pt-6 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-x-8 lg:px-12">
            <div class="lg:col-span-9 lg:col-start-4">
                <UBreadcrumb
                    :items="breadcrumb"
                    :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                    class="print:hidden"
                />
                <p class="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs md:mt-8">
                    <span class="font-semibold uppercase tracking-[0.12em] text-secondary">{{ $t(FORMAT_KEYS[article.format]) }}</span>
                    <template v-if="article.category">
                        <span
                            class="text-dimmed"
                            aria-hidden="true"
                        >·</span>
                        <ULink
                            :to="{ name: 'category', params: { slug: article.category.slug } }"
                            raw
                            class="font-medium text-muted underline-offset-4 hover:underline"
                        >
                            {{ article.category.name }}
                        </ULink>
                    </template>
                </p>
                <h1 class="mt-4 max-w-[18ch] font-serif text-[2.375rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3.25rem] lg:text-[3.75rem]">
                    {{ article.title }}
                </h1>
                <p
                    v-if="article.excerpt"
                    class="mt-6 max-w-measure border-y border-default py-5 font-serif text-[1.1875rem] leading-relaxed text-toned italic md:text-[1.3125rem]"
                >
                    {{ article.excerpt }}
                </p>

                <div class="mt-5 flex max-w-measure flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Byline
                        :authors="bylineAuthors"
                        :published-at="article.publishedAt"
                        :reading-minutes="article.readingMinutes"
                        avatars
                    />
                    <ShareBar
                        :title="article.title"
                        :url="article.permalink"
                        :cite-to="{ hash: '#citar' }"
                        class="-ml-3 sm:-mr-3 sm:ml-0"
                    />
                </div>
            </div>
        </header>

        <div class="mx-auto grid max-w-site grid-cols-1 px-4 pt-10 pb-16 md:px-8 md:pt-12 lg:grid-cols-12 lg:gap-x-8 lg:px-12 lg:pb-20">
            <ArticleToc
                :items="article.body.toc"
                class="mb-10 lg:col-span-3 lg:mb-0"
            />

            <div class="min-w-0 lg:col-span-9">
                <!-- eslint-disable vue/no-v-html -- sanitised by the articles layer's body mapper -->
                <div
                    class="hl-prose max-w-measure"
                    v-html="article.body.lead"
                />
                <figure
                    v-if="article.image"
                    class="my-10 max-w-measure md:my-11"
                >
                    <img
                        :src="article.image.url"
                        :alt="article.image.alt"
                        :width="article.image.width"
                        :height="article.image.height"
                        class="aspect-video w-full rounded-xs object-cover"
                    >
                </figure>
                <div
                    class="hl-prose mt-[1.25em] max-w-measure"
                    v-html="article.body.html"
                />
                <!-- eslint-enable vue/no-v-html -->

                <div class="mt-12 flex max-w-measure flex-col gap-12 lg:mt-16">
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
            </div>
        </div>

        <section
            v-if="article.category && related.length"
            aria-labelledby="mas-materia"
            class="border-t border-default bg-ivory-50 print:hidden"
        >
            <div class="mx-auto grid max-w-site grid-cols-1 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-x-8 lg:px-12 lg:py-20">
                <div class="lg:col-span-9 lg:col-start-4">
                    <div class="flex flex-col gap-2 border-t-2 border-huella-slate-900 pt-4 sm:flex-row sm:items-end sm:justify-between">
                        <h2
                            id="mas-materia"
                            class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                        >
                            {{ $t("article.related.title", { subject: article.category.name }) }}
                        </h2>
                        <UButton
                            variant="link"
                            :label="$t('article.related.all')"
                            trailing-icon="i-lucide-arrow-right"
                            :to="{ name: 'category', params: { slug: article.category.slug } }"
                            class="-ml-3 self-start sm:-mr-3 sm:ml-0 sm:self-auto"
                        />
                    </div>
                    <ArticleList
                        :articles="related"
                        variant="row"
                    />
                </div>
            </div>
        </section>
    </article>
</template>
