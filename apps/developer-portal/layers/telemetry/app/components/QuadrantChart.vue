<template>
    <figure class="flex flex-col gap-3">
        <ul class="flex flex-wrap gap-4 text-xs text-muted">
            <li v-for="item in legendItems" :key="item.label" class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-full" :style="item.style" />
                {{ item.label }}
            </li>
        </ul>

        <p class="text-2xs text-dimmed">↑ {{ yLabel }}</p>

        <div class="relative ml-8 h-72 border-b border-l border-accented">
            <div
                v-for="tick in yTicks"
                :key="`y-${tick.label}`"
                class="absolute inset-x-0 border-t border-default"
                :style="tick.style"
            >
                <span
                    class="absolute right-full mr-1.5 -translate-y-1/2 text-2xs text-dimmed tabular-nums"
                >
                    {{ tick.label }}
                </span>
            </div>
            <div
                v-for="tick in xTicks"
                :key="`x-${tick.label}`"
                class="absolute inset-y-0 border-l border-default"
                :style="tick.style"
            >
                <span
                    class="absolute top-full mt-1 -translate-x-1/2 text-2xs text-dimmed tabular-nums"
                >
                    {{ tick.label }}
                </span>
            </div>

            <div
                class="absolute inset-y-0 border-l border-dashed border-inverted/40"
                :style="thresholds.x"
            />
            <div
                class="absolute inset-x-0 border-t border-dashed border-inverted/40"
                :style="thresholds.y"
            />

            <span
                v-for="quadrant in quadrants"
                :key="quadrant.label"
                class="absolute max-w-1/2 text-2xs font-semibold tracking-wide uppercase"
                :class="[CORNERS[quadrant.corner], quadrant.bad ? 'tone-bad' : 'text-muted']"
            >
                {{ quadrant.label }}
            </span>

            <template v-for="point in dots" :key="point.name">
                <span
                    class="absolute size-3 -translate-x-1/2 translate-y-1/2 rounded-full"
                    :style="point.dot"
                    :title="point.title"
                />
                <span
                    v-if="point.labelled"
                    class="absolute translate-y-1/2 rounded-xs bg-default/80 px-0.5 font-mono text-2xs whitespace-nowrap"
                    :style="point.label"
                >
                    {{ point.name }}
                </span>
            </template>
        </div>

        <figcaption class="mt-3 text-center text-2xs text-dimmed">{{ xLabel }} →</figcaption>
    </figure>
</template>

<script setup lang="ts" generic="Kind extends string">
import type { Quadrants } from "#layers/telemetry/shared/usageView.ts";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface Props {
    chart: Quadrants<Kind>;
    /** How each kind of point is drawn and named in the legend. */
    kinds: Record<Kind, { label: string; color: string; hollow?: boolean }>;
    quadrants: readonly { corner: Corner; label: string; bad?: boolean }[];
    xLabel: string;
    yLabel: string;
}

const { chart, kinds, quadrants, xLabel, yLabel } = defineProps<Props>();

/** Past this share of the width a point's name goes on its left, so it never runs off the plot. */
const LABEL_FLIP = 70;

const CORNERS = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2 text-right",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2 text-right",
} as const satisfies Record<Corner, string>;

const fill = ({ color, hollow }: { color: string; hollow?: boolean }) => ({
    background: hollow ? "var(--ui-bg)" : color,
    border: hollow ? `2px solid ${color}` : undefined,
    boxShadow: "0 0 0 2px var(--ui-bg)",
});

const legendItems = computed(() =>
    (Object.values(kinds) as Props["kinds"][Kind][]).map((kind) => ({
        label: kind.label,
        style: fill(kind),
    })),
);

const yTicks = computed(() =>
    chart.y.ticks.map((tick) => ({ label: tick.label, style: { bottom: `${tick.at}%` } })),
);

const xTicks = computed(() =>
    chart.x.ticks.map((tick) => ({ label: tick.label, style: { left: `${tick.at}%` } })),
);

const thresholds = computed(() => ({
    x: { left: `${chart.x.threshold}%` },
    y: { bottom: `${chart.y.threshold}%` },
}));

const dots = computed(() =>
    chart.points.map((point) => ({
        name: point.name,
        title: point.title,
        labelled: point.labelled,
        dot: { left: `${point.x}%`, bottom: `${point.y}%`, ...fill(kinds[point.kind]) },
        label:
            point.x > LABEL_FLIP
                ? { right: `calc(${100 - point.x}% + 0.625rem)`, bottom: `${point.y}%` }
                : { left: `calc(${point.x}% + 0.625rem)`, bottom: `${point.y}%` },
    })),
);
</script>
