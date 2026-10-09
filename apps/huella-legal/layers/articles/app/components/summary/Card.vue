<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

type Variant = "lead" | "standard" | "compact" | "media" | "row";

interface Recipe {
    gap: string;
    layout: string;
    media: "always" | "image" | false;
    frame: string;
    body: string;
    title: string;
    excerpt: string | false;
    byline: string;
    readingTime: boolean;
    eager: boolean;
}

interface Props {
    article: ArticleSummary;
    variant?: Variant;
}

const props = withDefaults(defineProps<Props>(), { variant: "standard" });

const VARIANTS = {
    lead: {
        gap: "gap-5",
        layout: "lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-12",
        media: "image",
        frame: "aspect-[3/2] lg:col-span-7 lg:row-span-4",
        body: "lg:col-span-5",
        title: "text-[2rem] leading-[1.12] tracking-[-0.015em] md:text-h1 lg:text-[2.75rem]",
        excerpt: "text-reading max-w-measure",
        byline: "mt-1",
        readingTime: true,
        eager: true,
    },
    standard: {
        gap: "gap-3",
        layout: "",
        media: false,
        frame: "",
        body: "",
        title: "text-card",
        excerpt: "text-base leading-relaxed line-clamp-3",
        byline: "",
        readingTime: true,
        eager: false,
    },
    media: {
        gap: "gap-3",
        layout: "",
        media: "always",
        frame: "aspect-[3/2]",
        body: "",
        title: "text-card",
        excerpt: "text-base leading-relaxed line-clamp-3",
        byline: "",
        readingTime: true,
        eager: false,
    },
    row: {
        gap: "gap-2",
        layout: "sm:grid sm:grid-cols-[1fr_9rem] sm:items-start sm:gap-x-6 md:grid-cols-[1fr_11rem] md:gap-x-8",
        media: "always",
        frame: "hidden aspect-[4/3] sm:order-last sm:block",
        body: "",
        title: "text-card md:text-h3",
        excerpt: "max-w-measure text-base leading-relaxed line-clamp-2",
        byline: "",
        readingTime: true,
        eager: false,
    },
    compact: {
        gap: "gap-2",
        layout: "",
        media: false,
        frame: "",
        body: "",
        title: "text-lg leading-snug",
        excerpt: false,
        byline: "",
        readingTime: false,
        eager: false,
    },
} as const satisfies Record<Variant, Recipe>;

const ui = computed<Recipe>(() => VARIANTS[props.variant]);
const hasMedia = computed<boolean>(
    () => ui.value.media === "always" || (ui.value.media === "image" && !!props.article.image),
);
const authors = computed(() =>
    props.article.authors.map((author) => ({
        ...author,
        to: { name: "author", params: { slug: author.slug } } satisfies RouteLocationRaw,
    })),
);
</script>

<template>
    <!-- The title is the only link to the article and stretches over the card, so the other links sit above it -->
    <article class="group relative flex flex-col" :class="[ui.gap, hasMedia && ui.layout]">
        <div v-if="hasMedia" class="@container overflow-hidden rounded-xs" :class="ui.frame">
            <!-- Decorative: the title beside it already names the article -->
            <img
                v-if="article.image"
                :src="article.image.url"
                :width="article.image.width"
                :height="article.image.height"
                alt=""
                :loading="ui.eager ? 'eager' : 'lazy'"
                class="size-full object-cover"
            />
            <MediaFallback v-else />
        </div>

        <div class="flex min-w-0 flex-col" :class="[ui.gap, ui.body]">
            <BaseKicker
                v-if="article.category"
                :to="{ name: 'category', params: { slug: article.category.slug } }"
                class="relative z-10 self-start"
            >
                {{ article.category.name }}
            </BaseKicker>

            <h3 class="font-serif text-highlighted text-balance" :class="ui.title">
                <ULink
                    :to="{ name: 'article', params: { slug: article.slug } }"
                    raw
                    class="decoration-huella-slate-300 decoration-1 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline focus-visible:rounded-xs focus-visible:outline-offset-4"
                >
                    {{ article.title }}
                </ULink>
            </h3>

            <p
                v-if="ui.excerpt && article.excerpt"
                class="font-serif text-toned text-pretty"
                :class="ui.excerpt"
            >
                {{ article.excerpt }}
            </p>

            <Byline
                :authors
                :published-at="article.publishedAt"
                :reading-minutes="ui.readingTime ? article.readingMinutes : undefined"
                class="[&_a]:relative [&_a]:z-10"
                :class="ui.byline"
            />
        </div>
    </article>
</template>
