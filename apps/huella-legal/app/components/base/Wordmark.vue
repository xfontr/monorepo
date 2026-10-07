<script setup lang="ts">
import type { Tone } from "~/types/Tone";

type Size = "sm" | "md";

interface Recipe {
    name: string
    accent: string
    tagline: string
}

interface Props {
    size?: Size
    tone?: Tone
    tagline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
    tone: "paper",
    tagline: false,
});

const SIZES = {
    sm: "text-xl",
    md: "text-[1.625rem]",
} as const satisfies Record<Size, string>;

const TONES = {
    paper: { name: "text-highlighted", accent: "text-primary", tagline: "text-muted" },
    slate: { name: "text-ivory-50", accent: "text-huella-teal-300", tagline: "text-huella-slate-200" },
} as const satisfies Record<Tone, Recipe>;

const ui = computed<Recipe>(() => TONES[props.tone]);
</script>

<template>
    <span class="inline-flex flex-col leading-none">
        <span
            class="font-serif tracking-[-0.01em] whitespace-nowrap"
            :class="[SIZES[size], ui.name]"
        >{{ $t("wordmark.lead") }} <span
            class="italic"
            :class="ui.accent"
        >{{ $t("wordmark.accent") }}</span></span>
        <span
            v-if="tagline"
            class="mt-1.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em]"
            :class="ui.tagline"
        >{{ $t("wordmark.tagline") }}</span>
    </span>
</template>
