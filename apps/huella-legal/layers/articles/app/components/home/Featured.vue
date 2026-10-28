<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import { FORMAT_KEYS } from "#layers/articles/app/constants";

interface Props {
    lead: ArticleSummary;
    latest: ArticleSummary[];
}

const props = defineProps<Props>();

const latestId = useId();

const articleLink = (slug: string): RouteLocationRaw => ({ name: "article", params: { slug } });

const leadLink = computed<RouteLocationRaw>(() => articleLink(props.lead.slug));

const authors = computed(() => bylineAuthors(props.lead.authors));
</script>

<template>
    <UContainer
        as="section"
        :aria-label="$t('homeFeatured.label')"
        class="grid grid-cols-1 gap-12 pt-8 pb-16 lg:grid-cols-12 lg:gap-0 lg:pt-10 lg:pb-20"
    >
        <article class="group relative flex flex-col gap-5 lg:col-span-8 lg:pr-12">
            <div class="@container aspect-[16/10] overflow-hidden rounded-xs">
                <!-- Decorative: the title below it already names the article -->
                <NuxtImg
                    v-if="lead.image"
                    :src="lead.image.url"
                    :width="lead.image.width"
                    :height="lead.image.height"
                    sizes="100vw lg:720px"
                    alt=""
                    fetchpriority="high"
                    class="size-full object-cover"
                />
                <MediaFallback v-else tone="slate" />
            </div>
            <p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs">
                <BaseKicker>{{
                    $t(`homeFeatured.formats.${FORMAT_KEYS[lead.format]}`)
                }}</BaseKicker>
                <template v-if="lead.category">
                    <span class="text-dimmed" aria-hidden="true">·</span>
                    <ULink
                        raw
                        :to="{ name: 'category', params: { slug: lead.category.slug } }"
                        class="relative z-10 font-medium text-muted underline-offset-4 hover:underline focus-visible:rounded-xs"
                        >{{ lead.category.name }}</ULink
                    >
                </template>
            </p>
            <h2
                class="font-serif text-[2rem] leading-[1.12] tracking-[-0.02em] text-highlighted text-balance md:text-h1 lg:text-[2.875rem]"
            >
                <ULink
                    raw
                    :to="leadLink"
                    class="decoration-huella-slate-300 decoration-2 underline-offset-[0.14em] after:absolute after:inset-0 group-hover:underline focus-visible:rounded-xs focus-visible:outline-offset-4"
                    >{{ lead.title }}</ULink
                >
            </h2>
            <p v-if="lead.excerpt" class="max-w-measure font-serif text-reading text-toned">
                {{ lead.excerpt }}
            </p>
            <Byline
                :authors
                :published-at="lead.publishedAt"
                :reading-minutes="lead.readingMinutes"
                avatars
                class="[&_a]:relative [&_a]:z-10"
            />
        </article>

        <aside
            :aria-labelledby="latestId"
            class="border-t-2 border-huella-slate-900 pt-4 lg:col-span-4 lg:border-t-0 lg:border-l lg:border-default lg:pt-0 lg:pl-10"
        >
            <h2 :id="latestId" class="text-kicker text-muted">
                {{ $t("homeFeatured.latest.title") }}
            </h2>
            <ol class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)">
                <li
                    v-for="(article, index) in latest"
                    :key="article.id"
                    class="relative grid grid-cols-[2rem_1fr] py-4"
                >
                    <span
                        class="font-serif text-xl leading-snug text-huella-teal-600 tabular-nums"
                        aria-hidden="true"
                        >{{ index + 1 }}</span
                    >
                    <span class="flex flex-col gap-1">
                        <BaseKicker>{{
                            $t(`homeFeatured.formats.${FORMAT_KEYS[article.format]}`)
                        }}</BaseKicker>
                        <ULink
                            raw
                            :to="articleLink(article.slug)"
                            class="font-serif text-lg leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] after:absolute after:inset-0 hover:underline focus-visible:rounded-xs focus-visible:outline-offset-2"
                            >{{ article.title }}</ULink
                        >
                        <span class="font-sans text-meta text-muted">{{
                            article.authors.map(({ name }) => name).join(", ")
                        }}</span>
                    </span>
                </li>
            </ol>
            <UButton
                variant="link"
                :label="$t('homeFeatured.latest.all')"
                trailing-icon="i-lucide-arrow-right"
                :to="{ name: 'publications' }"
                class="-ml-3"
            />
        </aside>
    </UContainer>
</template>
