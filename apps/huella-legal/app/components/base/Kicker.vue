<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { Tone } from "~/types/Tone";

interface Props {
    to?: RouteLocationRaw
    tone?: Tone
    muted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    tone: "paper",
    muted: false,
});

const TONES = {
    paper: "text-secondary",
    slate: "text-huella-teal-200",
} as const satisfies Record<Tone, string>;

const toneClass = computed<string>(() => (props.muted ? "text-muted" : TONES[props.tone]));
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
