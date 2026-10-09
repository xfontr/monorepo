<script setup lang="ts">
import Byline from "./Byline.vue";
import MediaFallback from "./MediaFallback.vue";
import { formats, seriesEntries, type ArchiveEntry } from "./fixtures-b";
import { useLabHref } from "./variant";

interface Props {
    entry: ArchiveEntry;
    showSubject?: boolean;
    density?: "default" | "compact";
    // A thumbnail on the right from `sm` up; an entry without an image gets the paper tile
    media?: boolean;
}

// Text-only listing row: the kicker names what the page doesn't already say. The title link
// stretches over the row so a one-line title is still a 44 px target; other links sit above it.
const props = withDefaults(defineProps<Props>(), {
    showSubject: false,
    density: "default",
    media: false,
});

const href = useLabHref();
const format = computed(() => formats.find((item) => item.slug === props.entry.format)!);
const seriesLength = computed(
    () => props.entry.series && seriesEntries(props.entry.series.slug).length,
);
</script>

<template>
    <article
        class="group relative flex flex-col gap-2"
        :class="media && 'sm:flex-row sm:items-start sm:gap-6 md:gap-8'"
    >
        <div :class="media ? 'flex min-w-0 flex-1 flex-col gap-2' : 'contents'">
            <p
                class="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans text-xs [&_a]:relative [&_a]:z-10"
            >
                <span class="font-semibold uppercase tracking-[0.12em] text-secondary">{{
                    format.name
                }}</span>
                <template v-if="showSubject || entry.subtopic">
                    <span class="text-dimmed" aria-hidden="true">·</span>
                    <a
                        v-if="showSubject"
                        :href="`${href('/lab/publicaciones')}?materia=${entry.subject}`"
                        data-inline
                        class="font-medium text-muted underline-offset-4 hover:underline"
                        >{{ entry.category }}</a
                    >
                    <span v-else class="font-medium text-muted">{{ entry.subtopic }}</span>
                </template>
                <template v-if="entry.series">
                    <span class="text-dimmed" aria-hidden="true">·</span>
                    <a
                        href="/lab/attempts/serie-b"
                        data-inline
                        class="font-semibold text-primary underline-offset-4 hover:underline"
                        >Serie · {{ entry.series.position }} de {{ seriesLength }}</a
                    >
                </template>
            </p>

            <h3
                class="font-serif text-highlighted text-balance"
                :class="
                    density === 'compact'
                        ? 'text-lg leading-snug'
                        : 'text-[1.375rem] leading-[1.28] md:text-h3'
                "
            >
                <a
                    :href="href('/lab/article')"
                    class="decoration-huella-slate-300 decoration-1 underline-offset-[0.2em] group-hover:underline after:absolute after:inset-0 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >{{ entry.title }}</a
                >
            </h3>

            <p
                v-if="density === 'default' && entry.excerpt"
                class="max-w-measure font-serif text-base leading-relaxed text-toned line-clamp-2"
            >
                {{ entry.excerpt }}
            </p>

            <Byline
                :authors="entry.authors"
                :date="entry.date"
                :reading-minutes="density === 'default' ? entry.readingMinutes : undefined"
                class="mt-0.5 [&_a]:relative [&_a]:z-10"
            />
        </div>

        <div
            v-if="media"
            class="@container hidden aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-xs sm:block md:w-44"
        >
            <MediaFallback :tone="entry.media === 'image' ? 'slate' : 'paper'" />
        </div>
    </article>
</template>
