<template>
    <ol class="skyline grid grid-cols-7 items-end">
        <li
            v-for="(stage, index) in stages"
            :key="stage.id"
            class="flex min-w-0 flex-col gap-2"
            :style="{ '--hue': stageColor(index) }"
        >
            <div
                class="tower flex cursor-pointer flex-wrap-reverse gap-0.75 rounded-lg p-1 transition-colors sm:p-1.5"
                :class="{ 'is-selected': stage.id === selected }"
                @click="emit('select-stage', stage.id)"
            >
                <button
                    v-for="capability in stage.capabilities"
                    :key="capability.id"
                    type="button"
                    class="cell size-3 rounded-xs border sm:size-3.5"
                    :class="[capability.state, capability.id === highlight && 'is-highlighted']"
                    :aria-pressed="capability.id === highlight"
                    :style="{ '--state': capabilityColor(capability.state) }"
                    :title="`${capability.title} · ${capabilityStateLabel(capability.state)}`"
                    :aria-label="`${capability.title}, ${capabilityStateLabel(capability.state)}`"
                    @click.stop="(emit('select-stage', stage.id), emit('select', capability.id))"
                />
            </div>

            <span class="h-0.5 rounded-full bg-(--hue) opacity-70" aria-hidden="true" />

            <button
                type="button"
                class="flex flex-col items-start gap-1 rounded-sm text-left"
                :aria-pressed="stage.id === selected"
                @click="emit('select-stage', stage.id)"
            >
                <span
                    class="text-sm/tight font-bold"
                    :class="stage.id === selected ? 'text-highlighted' : 'text-muted'"
                >
                    <span class="sm:hidden" aria-hidden="true">{{ index + 1 }}</span>
                    <span class="sr-only sm:not-sr-only">{{ stage.title }}</span>
                </span>
                <span class="hidden font-mono text-xs text-muted tabular-nums sm:inline"
                    >{{ stage.progress.done }}/{{ stage.progress.total }}</span
                >
            </button>
        </li>
    </ol>
</template>

<script setup lang="ts">
import type { StageView } from "#layers/workflows/shared/workflows.ts";

interface Props {
    stages: StageView[];
    selected: string | null;
    /** The selected block, ringed so picking it anywhere else on the page points at its square. */
    highlight?: string | null;
}

const { stages, selected, highlight = null } = defineProps<Props>();
const emit = defineEmits<{
    "select-stage": [stage: string];
    select: [capability: string];
}>();
</script>

<style scoped>
.skyline {
    gap: clamp(0.375rem, 2vw, 1.5rem);
}

.tower.is-selected {
    background: color-mix(in oklab, var(--hue) 10%, transparent);
}

.cell {
    border-color: var(--state);
}

.cell.done,
.cell.in-flight,
.cell.ready,
.cell.waiting-on-you,
.cell.skipped {
    background: var(--state);
}

.cell.off {
    border-style: dashed;
    opacity: 0.45;
}

.cell.skipped {
    opacity: 0.6;
}

.cell:hover,
.cell.is-highlighted {
    transform: scale(1.35);
}

.cell.is-highlighted {
    outline: 2px solid var(--ui-text-highlighted);
    outline-offset: 1px;
}

@media (prefers-reduced-motion: no-preference) {
    .cell {
        transition: transform 0.15s;
    }

    .cell.in-flight {
        animation: breathe 2.4s ease-in-out infinite;
    }
}

@keyframes breathe {
    50% {
        opacity: 0.55;
    }
}
</style>
