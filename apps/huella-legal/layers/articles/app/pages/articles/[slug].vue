<script setup lang="ts">
definePageMeta({ name: "article", path: "/:slug/" });

const { article, related, breadcrumb, formatLabel, tagNames } = await useArticle();

const bylineAuthors = computed(() => article.value?.authors.map((author) => ({ ...author, to: { hash: "#autor" } })) ?? []);
</script>

<template>
    <article v-if="article">
        <UContainer
            as="header"
            class="grid grid-cols-1 pt-6 md:pt-10 lg:grid-cols-12 lg:gap-x-8"
        >
            <div class="lg:col-span-9 lg:col-start-4">
                <UBreadcrumb
                    :items="breadcrumb"
                    :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                    class="print:hidden"
                />
                <p class="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs md:mt-8">
                    <BaseKicker>{{ formatLabel }}</BaseKicker>
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
                <h1 class="mt-4 max-w-[18ch] font-serif text-display-sm text-highlighted text-balance md:text-display lg:text-display-lg">
                    {{ article.title }}
                </h1>
                <p
                    v-if="article.excerpt"
                    class="mt-6 max-w-measure border-y border-default py-5 font-serif text-standfirst text-toned italic md:text-standfirst-lg"
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
        </UContainer>

        <UContainer class="grid grid-cols-1 pt-10 pb-16 md:pt-12 lg:grid-cols-12 lg:gap-x-8 lg:pb-20">
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
        </UContainer>

        <section
            v-if="article.category && related.length"
            aria-labelledby="mas-materia"
            class="border-t border-default bg-ivory-50 print:hidden"
        >
            <UContainer class="grid grid-cols-1 py-16 lg:grid-cols-12 lg:gap-x-8 lg:py-20">
                <div class="lg:col-span-9 lg:col-start-4">
                    <BaseSectionHeading
                        id="mas-materia"
                        :title="$t('article.related.title', { subject: article.category.name })"
                        :action="{ label: $t('article.related.all'), to: { name: 'category', params: { slug: article.category.slug } } }"
                    />
                    <ArticleList
                        :articles="related"
                        variant="row"
                    />
                </div>
            </UContainer>
        </section>
    </article>
</template>
