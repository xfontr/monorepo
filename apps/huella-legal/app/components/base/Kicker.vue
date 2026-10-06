<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface Props {
    to?: RouteLocationRaw
    tone?: "teal" | "muted" | "paper"
}

const props = withDefaults(defineProps<Props>(), {
    to: undefined,
    tone: "teal",
});

const TONES = {
    teal: "text-secondary",
    muted: "text-muted",
    paper: "text-huella-teal-200",
} as const;

const toneClass = computed<string>(() => TONES[props.tone]);
</script>

<template>
    <ULink
        v-if="to"
        :to
        raw
        class="inline-block text-kicker underline-offset-4 hover:underline focus-visible:rounded-xs"
        :class="toneClass"
    >
        <slot />
    </ULink>
    <span
        v-else
        class="inline-block text-kicker"
        :class="toneClass"
    ><slot /></span>
</template>
