<template>
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
        <svg :viewBox="`0 0 ${size} ${size}`" class="-rotate-90" aria-hidden="true">
            <circle
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke-width="stroke"
                class="stroke-default"
            />
            <circle
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke-width="stroke"
                stroke="currentColor"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="offset"
                :class="colorClass"
            />
        </svg>
        <span
            class="absolute inset-0 flex items-center justify-center font-semibold tabular-nums"
            :class="size >= 80 ? 'text-lg' : 'text-xs'"
        >
            {{ percent }}%
        </span>
    </div>
</template>

<script setup lang="ts">
interface Props {
    percent: number;
    size?: number;
}

const { percent, size = 56 } = defineProps<Props>();

const stroke = computed(() => Math.max(4, Math.round(size / 12)));
const radius = computed(() => (size - stroke.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => circumference.value * (1 - Math.min(percent, 100) / 100));
const colorClass = computed(() => toneClass(progressTone(percent)) || "text-dimmed");
</script>
