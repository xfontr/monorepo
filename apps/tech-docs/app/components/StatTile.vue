<script setup lang="ts">
import type { Tone } from "../utils/format.ts";

const { label, value, hint = undefined, icon = undefined, tone = "neutral", to = undefined } = defineProps<{
    label: string
    value: string | number
    hint?: string
    icon?: string
    tone?: Tone
    to?: string
}>();

const toneClass = computed(() => (tone === "neutral" ? "" : `tone-${tone}`));
</script>

<template>
    <NuxtLink
        v-if="to"
        :to="to"
        class="flex flex-col gap-1 rounded-lg border border-default bg-default p-4 hover:bg-elevated/50 transition-colors"
    >
        <div class="flex items-center gap-1.5 text-xs text-muted">
            <UIcon
                v-if="icon"
                :name="icon"
                class="size-3.5"
            />
            {{ label }}
        </div>

        <div
            class="text-2xl font-semibold tabular-nums"
            :class="toneClass"
        >
            {{ value }}
        </div>

        <div
            v-if="hint"
            class="text-xs text-dimmed truncate"
        >
            {{ hint }}
        </div>
    </NuxtLink>

    <div
        v-else
        class="flex flex-col gap-1 rounded-lg border border-default bg-default p-4"
    >
        <div class="flex items-center gap-1.5 text-xs text-muted">
            <UIcon
                v-if="icon"
                :name="icon"
                class="size-3.5"
            />
            {{ label }}
        </div>

        <div
            class="text-2xl font-semibold tabular-nums"
            :class="toneClass"
        >
            {{ value }}
        </div>

        <div
            v-if="hint"
            class="text-xs text-dimmed truncate"
        >
            {{ hint }}
        </div>
    </div>
</template>
