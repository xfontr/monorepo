<template>
    <ol class="skyline grid grid-cols-7 items-end">
        <li
            v-for="(stage, index) in stages"
            :key="stage.id"
            class="flex min-w-0 flex-col gap-2.5"
            :style="{ '--hue': stageColor(index) }"
        >
            <div
                class="tower relative grid cursor-pointer content-end justify-center rounded-xl p-1 transition-colors sm:p-2"
                :class="{ 'is-selected': stage.id === selected }"
                @click="emit('select-stage', stage.id)"
            >
                <button
                    v-for="capability in stage.capabilities"
                    :key="capability.id"
                    type="button"
                    class="cell aspect-square rounded-sm border-2"
                    :class="[capability.state, capability.id === highlight && 'is-highlighted']"
                    :aria-pressed="capability.id === highlight"
                    :style="{
                        '--state': capabilityColor(capability.state),
                        '--order': order.get(capability.id),
                    }"
                    :title="`${capability.title} · ${capabilityStateLabel(capability.state)}`"
                    :aria-label="`${capability.title}, ${capabilityStateLabel(capability.state)}`"
                    @click.stop="(emit('select-stage', stage.id), emit('select', capability.id))"
                />
            </div>

            <span class="h-1 rounded-full bg-(--hue) opacity-85" aria-hidden="true" />

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

const order = computed(
    () =>
        new Map(
            stages
                .flatMap((stage) => stage.capabilities)
                .map((capability, index) => [capability.id, index]),
        ),
);
</script>

<style scoped>
.skyline {
    gap: clamp(0.375rem, 2vw, 1.5rem);
}

.tower {
    grid-template-columns: repeat(3, minmax(0, 1.625rem));
    gap: clamp(2px, 0.6vw, 5px);
}

.tower.is-selected {
    background: color-mix(in oklab, var(--hue) 16%, transparent);
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

.cell.done {
    box-shadow: 0 0 10px color-mix(in oklab, var(--state) 45%, transparent);
}

.cell.in-flight {
    box-shadow: 0 0 12px color-mix(in oklab, var(--state) 60%, transparent);
}

.cell.off {
    border-style: dashed;
    opacity: 0.45;
}

.cell.skipped {
    opacity: 0.6;
}

.cell:hover {
    transform: scale(1.3);
}

.cell.is-highlighted {
    transform: scale(1.3);
    outline: 2px solid var(--ui-text-highlighted);
    outline-offset: 2px;
}

@media (prefers-reduced-motion: no-preference) {
    .cell {
        transition: transform 0.15s;
    }

    .cell.in-flight {
        animation: breathe 1.8s ease-in-out infinite;
    }

    .cell.done {
        animation: light 0.5s ease-out both;
        animation-delay: calc(var(--order) * 18ms);
    }
}

@keyframes breathe {
    50% {
        box-shadow: 0 0 22px color-mix(in oklab, var(--state) 85%, transparent);
    }
}

@keyframes light {
    from {
        filter: brightness(1.8) saturate(0.4);
    }
}
</style>
