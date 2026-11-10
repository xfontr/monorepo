<template>
    <svg
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        class="h-7 w-28 shrink-0 overflow-visible"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <path :d="area" fill="currentColor" opacity="0.25" />
        <polyline
            :points
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
        />
        <circle :cx="end.x" :cy="end.y" r="2.5" fill="currentColor" />
    </svg>
</template>

<script setup lang="ts">
interface Props {
    /** Active days per week, on the project's shared timeline. */
    weeks: number[];
    /** The shared top, so every card's line is drawn to one scale. */
    peak: number;
    label: string;
}

const { weeks, peak, label } = defineProps<Props>();

const WIDTH = 112;
const HEIGHT = 24;

const coordinates = computed(() => {
    const step = WIDTH / Math.max(weeks.length - 1, 1);

    return weeks.map((active, index) => ({
        x: Math.round(index * step * 10) / 10,
        y: Math.round((HEIGHT - (active / peak) * HEIGHT) * 10) / 10,
    }));
});

const points = computed(() => coordinates.value.map(({ x, y }) => `${x},${y}`).join(" "));
const area = computed(
    () => `M0,${HEIGHT} L${points.value.replaceAll(" ", " L")} L${WIDTH},${HEIGHT} Z`,
);
const end = computed(() => coordinates.value.at(-1) ?? { x: 0, y: HEIGHT });
</script>
