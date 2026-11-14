<template>
    <NuxtLink
        :to="`/workflows/${card.id}`"
        class="flex items-center gap-4 rounded-lg border border-default bg-default p-4 transition-colors hover:bg-elevated/50"
    >
        <ProgressRing :percent="card.percent" :size="64" />
        <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ card.title }}</p>
            <p class="truncate text-xs text-muted">{{ card.templateTitle }}</p>
            <p class="mt-1 text-xs text-dimmed tabular-nums">{{ card.done }}</p>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import { projectCard, type ProjectView } from "#layers/workflows/shared/workflows.ts";

interface Props {
    project: ProjectView;
}

const { project } = defineProps<Props>();

const card = computed(() => projectCard(project));
</script>
