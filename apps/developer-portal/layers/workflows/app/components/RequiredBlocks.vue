<template>
    <section v-if="stages.length > 0" class="flex flex-col gap-3">
        <header class="flex items-center gap-2">
            <UIcon name="i-lucide-lock" class="size-4 text-dimmed" />
            <h3 class="text-sm font-semibold">Always in the map</h3>
            <span class="text-sm text-muted tabular-nums">{{ total }} blocks</span>
        </header>
        <dl class="flex flex-col gap-2 rounded-xl border border-default bg-elevated/50 p-4">
            <div
                v-for="stage in stages"
                :key="stage.id"
                class="flex flex-col gap-1 sm:flex-row sm:gap-4"
                :style="{ '--stage': stage.color }"
            >
                <dt class="flex w-28 shrink-0 items-center gap-1.5 text-xs font-medium text-muted">
                    <span class="size-2 rounded-full bg-(--stage)" />
                    {{ stage.title }}
                </dt>
                <dd class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                    <span
                        v-for="block in stage.blocks"
                        :key="block.id"
                        class="flex items-center gap-1"
                        :title="block.kindLabel ?? undefined"
                    >
                        <UIcon v-if="block.icon" :name="block.icon" class="size-3.5 text-dimmed" />
                        {{ block.title }}
                    </span>
                </dd>
            </div>
        </dl>
    </section>
</template>

<script setup lang="ts">
import type { Template } from "#layers/workflows/shared/workflows.ts";

interface Props {
    template: Template;
}

const { template } = defineProps<Props>();

/** Blocks no switch removes; a required block inside an optional group belongs to that feature's card. */
const required = computed(() => {
    const optionalGroups = new Set(
        template.groups.filter(({ optional }) => optional).map(({ id }) => id),
    );
    return template.capabilities.filter(
        (capability) =>
            !capability.optional && !(capability.group && optionalGroups.has(capability.group)),
    );
});

const total = computed(() => required.value.length);

const stages = computed(() =>
    template.stages
        .map((stage, index) => ({
            id: stage.id,
            title: stage.title,
            color: stageColor(index),
            blocks: required.value
                .filter((capability) => capability.stage === stage.id)
                .map((capability) => ({
                    id: capability.id,
                    title: capability.title,
                    icon: blockKindIcon(capability.kind),
                    kindLabel: capability.kind === "build" ? null : blockKindLabel(capability.kind),
                })),
        }))
        .filter((stage) => stage.blocks.length > 0),
);
</script>
