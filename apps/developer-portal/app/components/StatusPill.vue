<template>
    <component
        :is="to ? NuxtLink : 'span'"
        :to
        :title="hint"
        class="shrink-0 rounded-full border border-current px-1.5 py-0.5 text-xs font-medium"
        :class="colorClass"
    >
        {{ label }}
    </component>
</template>

<script setup lang="ts">
import { NuxtLink } from "#components";
import type { Tone } from "../utils/format.ts";

interface Props {
    label: string;
    tone?: Tone;
    to?: string;
    hint?: string;
}

const { label, tone = "neutral", to, hint } = defineProps<Props>();

const colorClass = computed(() => toneClass(tone) || "text-dimmed");
</script>
