<template>
    <NuxtLink
        to="/workflows/new"
        :aria-label="label"
        :title="label"
        class="group flex min-h-24 w-24 items-center justify-center justify-self-start rounded-lg border border-dashed border-default bg-default p-4 text-dimmed transition-colors hover:border-inverted hover:bg-elevated/50 hover:text-highlighted"
    >
        <UIcon
            name="i-lucide-plus"
            class="size-10 transition-transform group-hover:scale-110"
            aria-hidden="true"
        />
    </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
    label?: string;
}

const { label = "New workflow" } = defineProps<Props>();
</script>
