<template>
    <ol class="skyline grid grid-cols-7 items-end gap-[clamp(0.375rem,2vw,1.5rem)]">
        <li
            v-for="(stage, index) in stages"
            :key="stage.id"
            class="flex min-w-0 flex-col gap-2.5"
            :style="{ '--hue': stageColor(index) }"
        >
            <div
                class="tower relative grid cursor-pointer grid-cols-[repeat(3,minmax(0,1.625rem))] content-end justify-center gap-[clamp(2px,0.6vw,5px)] rounded-xl p-1 sm:p-2 transition-colors"
                :class="{
                    'is-selected': stage.id === selected,
                    'is-current': stage.state === 'current',
                }"
                @click="emit('select-stage', stage.id)"
            >
                <button
                    v-for="capability in stage.capabilities"
                    :key="capability.id"
                    type="button"
                    class="cell aspect-square rounded border-2"
                    :class="[capability.state, capability.id === highlight && 'is-highlighted']"
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
                class="flex flex-col items-start gap-1 rounded text-left"
                :aria-pressed="stage.id === selected"
                @click="emit('select-stage', stage.id)"
            >
                <span
                    class="text-sm leading-tight font-bold"
                    :class="stage.id === selected ? 'text-highlighted' : 'text-muted'"
                >
                    <span class="sm:hidden" aria-hidden="true">{{ index + 1 }}</span>
                    <span class="sr-only sm:not-sr-only">{{ stage.title }}</span>
                </span>
                <span class="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span class="hidden font-mono tabular-nums sm:inline"
                        >{{ stage.progress.done }}/{{ stage.progress.total }}</span
                    >
                    <UIcon
                        v-if="stage.approvedOn"
                        name="i-lucide-circle-check"
                        class="tone-good size-4"
                        :aria-label="`Gate approved ${stage.approvedOn}`"
                    />
                    <span
                        v-if="stage.state === 'current'"
                        class="rounded-full bg-inverted px-1.5 text-[0.625rem] font-extrabold uppercase tracking-wider text-inverted"
                        >Now</span
                    >
                </span>
            </button>
        </li>
    </ol>
</template>

<script setup lang="ts">
import type { StageView } from "#shared/workflows.ts";

interface Props {
    stages: StageView[];
    selected: string | null;
    /** A capability to enlarge, so hovering it elsewhere on the page points at its square. */
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
.tower.is-selected {
    background: color-mix(in oklab, var(--hue) 16%, transparent);
}

.tower.is-current::after {
    content: "";
    position: absolute;
    inset: -0.375rem;
    border: 2px solid var(--hue);
    border-radius: 0.875rem;
    opacity: 0.7;
    pointer-events: none;
}

.cell {
    border-color: var(--state);
    transition: transform 0.15s;
}

.cell.done,
.cell.in-progress,
.cell.skipped {
    background: var(--state);
}

.cell.done {
    box-shadow: 0 0 10px color-mix(in oklab, var(--state) 45%, transparent);
}

.cell.in-progress {
    box-shadow: 0 0 12px color-mix(in oklab, var(--state) 60%, transparent);
}

.cell.off {
    border-style: dashed;
    opacity: 0.45;
}

.cell.skipped {
    opacity: 0.6;
}

.cell.is-highlighted,
.cell:hover {
    transform: scale(1.3);
}

@media (prefers-reduced-motion: no-preference) {
    .cell.in-progress {
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
