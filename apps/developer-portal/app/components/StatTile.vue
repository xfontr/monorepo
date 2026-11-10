<template>
    <component
        :is="to ? NuxtLink : 'div'"
        :to
        class="flex flex-col gap-1 rounded-lg border border-default bg-default p-4"
        :class="to && 'transition-colors hover:bg-elevated/50'"
    >
        <div class="flex items-center gap-1.5 text-xs text-muted">
            <UIcon v-if="icon" :name="icon" class="size-3.5" />
            {{ label }}
        </div>

        <div class="text-2xl font-semibold tabular-nums" :class="colorClass">
            {{ value }}
        </div>

        <div v-if="hint" class="truncate text-xs text-dimmed">
            {{ hint }}
        </div>
    </component>
</template>

<script setup lang="ts">
import { NuxtLink } from "#components";
import type { Tone } from "../utils/format.ts";

interface Props {
    label: string;
    value: string | number;
    hint?: string;
    icon?: string;
    tone?: Tone;
    to?: string;
}

const { label, value, hint, icon, tone = "neutral", to } = defineProps<Props>();

const colorClass = computed(() => toneClass(tone));
</script>
