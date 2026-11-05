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
    <span v-else class="inline-block text-kicker" :class="toneClass"><slot /></span>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface Props {
    to?: RouteLocationRaw;
    muted?: boolean;
}

const props = withDefaults(defineProps<Props>(), { muted: false });

const toneClass = computed<string>(() => (props.muted ? "text-muted" : "text-secondary"));
</script>
