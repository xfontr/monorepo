<template>
    <!-- The title is the only link to the article and stretches over the card, so the other links sit above it -->
    <article class="group relative flex flex-col" :class="[ui.gap, ui.layout]">
        <div v-if="ui.media" class="@container overflow-hidden rounded-xs" :class="ui.frame">
            <!-- Decorative: the title beside it already names the article -->
            <NuxtImg
                v-if="article.image"
                :src="article.image.url"
                :width="article.image.width"
                :height="imageHeight"
                fit="cover"
                :sizes="ui.sizes"
                alt=""
                loading="lazy"
                class="size-full object-cover"
            />
            <MediaFallback v-else />
        </div>

        <div class="flex min-w-0 flex-col" :class="ui.gap">
            <BaseKicker
                v-if="article.category"
                :to="{ name: 'category', params: { slug: article.category.slug } }"
                class="relative z-10 self-start"
            >
                {{ article.category.name }}
            </BaseKicker>

            <h3 class="font-serif text-balance text-highlighted" :class="ui.title">
                <ULink
                    :to="{ name: 'article', params: { slug: article.slug } }"
                    raw
                    class="underline-title decoration-1 group-hover:underline after:absolute after:inset-0 focus-visible:rounded-xs focus-visible:outline-offset-4"
                >
                    {{ article.title }}
                </ULink>
            </h3>

            <p v-if="article.excerpt" class="font-serif text-pretty text-toned" :class="ui.excerpt">
                {{ article.excerpt }}
            </p>

            <Byline
                :authors
                :published-at="article.publishedAt"
                :reading-minutes="article.readingMinutes"
                :comments
                class="[&_a]:relative [&_a]:z-10"
            />
        </div>
    </article>
</template>

<script setup lang="ts">
type Variant = "standard" | "media" | "row";

interface Recipe {
    gap: string;
    layout: string;
    media: boolean;
    frame: string;
    ratio: number;
    sizes: string;
    title: string;
    excerpt: string;
}

interface Props {
    article: ArticleSummary;
    variant?: Variant;
}

const props = withDefaults(defineProps<Props>(), { variant: "standard" });

const VARIANTS = {
    standard: {
        gap: "gap-3",
        layout: "",
        media: false,
        frame: "",
        ratio: 0,
        sizes: "",
        title: "text-card",
        excerpt: "text-base leading-relaxed line-clamp-3",
    },
    media: {
        gap: "gap-3",
        layout: "",
        media: true,
        frame: "aspect-3/2",
        ratio: 3 / 2,
        sizes: "sm:100vw md:50vw lg:360px",
        title: "text-card",
        excerpt: "text-base leading-relaxed line-clamp-3",
    },
    row: {
        gap: "gap-2",
        layout: "sm:grid sm:grid-cols-[1fr_9rem] sm:items-start sm:gap-x-6 md:grid-cols-[1fr_11rem] md:gap-x-8",
        media: true,
        frame: "hidden aspect-4/3 sm:order-last sm:block",
        ratio: 4 / 3,
        sizes: "144px md:176px",
        title: "text-card md:text-h3",
        excerpt: "max-w-measure text-base leading-relaxed line-clamp-2",
    },
} as const satisfies Record<Variant, Recipe>;

const ui = computed<Recipe>(() => VARIANTS[props.variant]);
const authors = computed(() => bylineAuthors(props.article.authors));
const imageHeight = computed(() => coverHeight(props.article.image?.width, ui.value.ratio));
const comments = computed(() =>
    props.article.commentCount
        ? {
              count: props.article.commentCount,
              to: {
                  name: "article" as const,
                  params: { slug: props.article.slug },
                  hash: "#comentarios",
              },
          }
        : undefined,
);
</script>
