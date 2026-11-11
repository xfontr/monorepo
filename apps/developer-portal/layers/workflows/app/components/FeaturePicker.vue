<template>
    <div class="grid gap-3 sm:grid-cols-2">
        <button
            v-for="card in cards"
            :key="card.id"
            type="button"
            role="switch"
            :aria-checked="card.enabled"
            :aria-label="`${card.title} in this project`"
            :disabled="!editable || card.needs !== null"
            class="group flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-elevated/50 disabled:cursor-default"
            :class="[
                card.enabled ? 'border-primary bg-primary/5' : 'border-default bg-default',
                card.within ? 'sm:col-span-2 sm:ml-8' : card.parent ? 'sm:col-span-2' : '',
                card.needs ? 'opacity-50' : '',
            ]"
            @click="emit('toggle', card.id, !card.enabled)"
        >
            <span class="flex items-start gap-3">
                <span
                    class="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    :class="card.enabled ? 'bg-primary text-inverted' : 'bg-elevated text-muted'"
                >
                    <UIcon :name="card.icon" class="size-5" />
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block font-semibold">{{ card.title }}</span>
                    <span class="block text-sm text-muted">{{ card.summary }}</span>
                </span>
                <UIcon
                    :name="card.enabled ? 'i-lucide-circle-check' : 'i-lucide-circle'"
                    class="size-5 shrink-0"
                    :class="card.enabled ? 'text-primary' : 'text-dimmed'"
                />
            </span>
            <span class="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <template v-if="card.blocks.length > 1">
                    <UBadge
                        v-for="block in card.blocks"
                        :key="block"
                        :label="block"
                        color="neutral"
                        variant="subtle"
                        size="sm"
                    />
                </template>
                <span>{{ card.note }}</span>
            </span>
        </button>
    </div>
</template>

<script setup lang="ts">
import type { Feature } from "#layers/workflows/shared/workflows.ts";

interface Props {
    features: Feature[];
    editable?: boolean;
}

const { features, editable = false } = defineProps<Props>();
const emit = defineEmits<{ toggle: [feature: string, on: boolean] }>();

/** A feature inside another, such as comments in the blog, follows its parent's full-width card. */
const cards = computed(() =>
    features
        .filter((feature) => feature.within === null)
        .flatMap((parent) => [parent, ...features.filter(({ within }) => within === parent.id)])
        .map((feature) => {
            const parent = features.find(({ id }) => id === feature.within);
            const needs = parent && !parent.enabled ? parent.title : null;
            const count = feature.blocks.length;

            return {
                ...feature,
                needs,
                parent: features.some(({ within }) => within === feature.id),
                icon: count > 1 ? "i-lucide-layers" : "i-lucide-puzzle",
                note: needs
                    ? `Needs ${needs}`
                    : `${count} ${count === 1 ? "block" : "blocks"} ${feature.enabled ? "in the map" : "left out"}`,
            };
        }),
);
</script>
