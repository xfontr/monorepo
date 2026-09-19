<script setup lang="ts">
import type { Tone } from "../utils/format.ts";

const { label, tone = "neutral", to = undefined, hint = undefined } = defineProps<{
    label: string
    tone?: Tone
    to?: string
    hint?: string
}>();

/** `main.css` defines a class for `good`, `warn` and `bad` only, so the fourth tone has to name a colour of its own. */
const toneClass = computed(() => (tone === "neutral" ? "text-dimmed" : `tone-${tone}`));
</script>

<template>
    <component
        :is="to ? 'NuxtLink' : 'span'"
        :to="to"
        :title="hint"
        class="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full border border-current"
        :class="toneClass"
    >
{{ label }}
</component>
</template>
