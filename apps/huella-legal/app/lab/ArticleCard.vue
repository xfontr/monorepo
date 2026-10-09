<script setup lang="ts">
import type { LabArticle } from "./fixtures";
import Byline from "./Byline.vue";
import Kicker from "./Kicker.vue";
import MediaFallback from "./MediaFallback.vue";
import { useLabHref } from "./variant";

interface Props {
    article: LabArticle;
    variant?: "lead" | "standard" | "compact" | "media" | "row";
    showExcerpt?: boolean;
    // Lead only: image beside the text from `lg` up instead of above it
    split?: boolean;
}

// One card, five densities. The title is the only link to the article, so category and author
// links inside the card never nest inside another anchor.
const props = withDefaults(defineProps<Props>(), {
    variant: "standard",
    showExcerpt: true,
    split: false,
});

const href = useLabHref();
const hasMedia = computed(
    () =>
        props.variant === "media" ||
        props.variant === "row" ||
        (props.variant === "lead" && props.article.media),
);
const gap = computed(
    () =>
        ({ lead: "gap-5", standard: "gap-3", media: "gap-3", row: "gap-2", compact: "gap-2" })[
            props.variant
        ],
);
</script>

<template>
    <article
        class="group relative flex flex-col"
        :class="[
            gap,
            split && 'lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-12',
            variant === 'row' &&
                'sm:grid sm:grid-cols-[1fr_9rem] sm:items-start sm:gap-x-6 md:grid-cols-[1fr_11rem] md:gap-x-8',
        ]"
    >
        <div
            v-if="hasMedia"
            class="@container overflow-hidden rounded-xs"
            :class="[
                variant === 'row' ? 'hidden aspect-[4/3] sm:order-last sm:block' : 'aspect-[3/2]',
                split && 'lg:col-span-7 lg:row-span-4',
            ]"
        >
            <MediaFallback
                :label="
                    article.media === 'image' && variant !== 'row'
                        ? 'Imagen del artículo'
                        : undefined
                "
                :tone="article.media === 'image' ? 'slate' : 'paper'"
            />
        </div>

        <div class="flex min-w-0 flex-col" :class="[gap, split && 'lg:col-span-5']">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 [&_a]:relative [&_a]:z-10">
                <Kicker :href="href('/lab/publicaciones')">
                    {{ article.category }}
                </Kicker>
                <span
                    v-if="article.issue && variant !== 'compact'"
                    class="font-sans text-xs tabular-nums text-dimmed"
                    >{{ article.issue }}</span
                >
            </div>

            <h3
                class="font-serif text-highlighted text-balance"
                :class="{
                    'text-[2rem] leading-[1.15] tracking-[-0.015em] md:text-h1':
                        variant === 'lead' && !split,
                    'text-[2rem] leading-[1.12] tracking-[-0.015em] md:text-h1 lg:text-[2.75rem]':
                        variant === 'lead' && split,
                    'text-[1.375rem] leading-[1.28]': variant === 'standard' || variant === 'media',
                    'text-[1.375rem] leading-[1.28] md:text-h3': variant === 'row',
                    'text-lg leading-snug': variant === 'compact',
                }"
            >
                <a
                    :href="href('/lab/article')"
                    class="decoration-huella-slate-300 decoration-1 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >{{ article.title }}</a
                >
            </h3>

            <p
                v-if="showExcerpt && article.excerpt && variant !== 'compact'"
                class="font-serif text-toned text-pretty"
                :class="
                    (
                        {
                            lead: 'text-reading max-w-measure',
                            row: 'max-w-measure text-base leading-relaxed line-clamp-2',
                        } as Partial<Record<typeof variant, string>>
                    )[variant] ?? 'text-base leading-relaxed line-clamp-3'
                "
            >
                {{ article.excerpt }}
            </p>

            <Byline
                :authors="article.authors"
                :date="article.date"
                :reading-minutes="variant === 'compact' ? undefined : article.readingMinutes"
                :class="variant === 'lead' ? 'mt-1' : ''"
                class="[&_a]:relative [&_a]:z-10"
            />
        </div>
    </article>
</template>
