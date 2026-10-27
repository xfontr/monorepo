<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { Tone } from "~/types/Tone";
import { FORMAT_KEYS } from "#layers/articles/app/constants";

interface Props {
    formats: Facet<ArticleSummary["format"]>[];
}

const props = defineProps<Props>();

const TONES = {
    paper: {
        item: "bg-muted",
        link: "hover:bg-default",
        title: "text-highlighted decoration-huella-slate-300",
        description: "text-toned",
        kicker: "subjectsFormats.format",
    },
    slate: {
        item: "bg-inverted",
        link: "hover:bg-huella-slate-800",
        title: "text-inverted",
        description: "text-huella-slate-200",
        kicker: "subjectsFormats.academic",
    },
} as const satisfies Record<Tone, Record<string, string>>;

const items = computed(() =>
    props.formats.map(({ value, count }) => {
        const tone: Tone = value === "tfg-tfm" ? "slate" : "paper";

        return {
            value,
            count,
            tone,
            key: FORMAT_KEYS[value],
            classes: TONES[tone],
            to: { name: "publications", query: { format: value } } satisfies RouteLocationRaw,
        };
    }),
);
</script>

<template>
    <section aria-labelledby="formatos" class="border-y border-default bg-muted">
        <UContainer class="py-16 lg:py-20">
            <h2 id="formatos" class="scroll-mt-6 text-kicker text-muted">
                {{ $t("subjectsFormats.title") }}
            </h2>
            <ul
                class="mt-4 grid gap-px overflow-hidden rounded-xs border border-default bg-(--ui-border) sm:grid-cols-2 lg:grid-cols-3"
            >
                <li
                    v-for="{ value, count, tone, key, classes, to } in items"
                    :key="value"
                    :class="classes.item"
                >
                    <ULink
                        raw
                        :to
                        class="group flex h-full flex-col gap-2 p-5 transition-colors focus-visible:-outline-offset-2 md:p-6"
                        :class="classes.link"
                    >
                        <BaseKicker :tone>
                            {{ $t(classes.kicker, { count }) }}
                        </BaseKicker>
                        <span
                            class="font-serif text-h3 decoration-1 underline-offset-[0.2em] group-hover:underline"
                            :class="classes.title"
                            >{{ $t(`subjectsFormats.formats.${key}.title`) }}</span
                        >
                        <span
                            class="font-serif text-base leading-relaxed"
                            :class="classes.description"
                            >{{ $t(`subjectsFormats.formats.${key}.description`) }}</span
                        >
                    </ULink>
                </li>
            </ul>
            <p class="mt-6 font-serif text-base leading-relaxed text-toned">
                {{ $t("subjectsFormats.publish.prompt") }}
                <ULink
                    raw
                    :to="{ name: 'publish', hash: '#tesis' }"
                    class="inline-flex min-h-11 items-center font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-xs"
                    >{{ $t("subjectsFormats.publish.link") }}</ULink
                >
            </p>
        </UContainer>
    </section>
</template>
