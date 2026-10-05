<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

const TONES = {
    teal: "text-secondary",
    muted: "text-muted",
    paper: "text-huella-teal-200",
} as const;

type Tone = typeof TONES[keyof typeof TONES];

interface Props {
    to?: RouteLocationRaw
    tone?: "teal" | "muted" | "paper"
}

const props = withDefaults(defineProps<Props>(), {
    to: undefined,
    tone: "teal",
});

const toneClass = computed<Tone>(() => TONES[props.tone]);
</script>

<template>
    <ULink
        v-if="to"
        :to
        raw
        class="inline-block font-sans text-xs font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="toneClass"
    >
        <slot />
    </ULink>
    <span
        v-else
        class="inline-block font-sans text-xs font-semibold uppercase tracking-[0.12em]"
        :class="toneClass"
    ><slot /></span>
</template>
