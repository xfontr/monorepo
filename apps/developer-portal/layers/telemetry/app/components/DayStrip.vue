<template>
    <ol class="flex h-4 min-w-xl gap-px">
        <li
            v-for="cell in cells"
            :key="cell.day"
            class="min-w-0 flex-1 rounded-xs"
            :class="!cell.style.background && 'bg-accented/40'"
            :style="cell.style"
            :title="cell.label"
        />
    </ol>
</template>

<script setup lang="ts">
import type { DayUsage } from "#layers/snapshot/shared/types.ts";

interface Props {
    days: string[];
    usage: DayUsage[];
    /** The darkest step, shared by every strip that should be read against this one. */
    busiest: number;
}

const { days, usage, busiest } = defineProps<Props>();

const cells = computed(() =>
    days.map((day, index) => {
        const { runs = 0, failures = 0 } = usage[index] ?? {};
        const failed = failures > 0 ? ` · ${failures} failed` : "";

        return {
            day,
            style: {
                background: heatColor("--usage-runs", runs, busiest),
                boxShadow: failures > 0 ? FAILED_MARK : undefined,
            },
            label: `${calendarDay(day)} · ${runs} ${runs === 1 ? "run" : "runs"}${failed}`,
        };
    }),
);
</script>
