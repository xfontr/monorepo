<script setup lang="ts">
interface Props {
    href?: string
    tone?: "teal" | "muted" | "paper"
}

withDefaults(defineProps<Props>(), { tone: "teal" });
</script>

<template>
    <component
        :is="href ? 'a' : 'span'"
        :href
        :data-inline="href ? '' : undefined"
        class="inline-block font-sans text-xs font-semibold uppercase tracking-[0.12em]"
        :class="[
            { teal: 'text-secondary', muted: 'text-muted', paper: 'text-huella-teal-200' }[tone],
            href && 'underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        ]"
    >
<slot />
</component>
</template>
