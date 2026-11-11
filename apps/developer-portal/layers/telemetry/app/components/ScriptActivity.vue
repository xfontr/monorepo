<template>
    <UCard variant="flush">
        <template #header>
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 class="font-semibold">Script activity</h2>
                    <p class="text-xs text-muted">
                        One cell per day. Darker means more runs; a red base means a run failed that
                        day. No free text is recorded: no titles, paths or issue numbers.
                    </p>
                </div>

                <ul class="flex flex-wrap items-center gap-4 text-xs text-muted">
                    <li v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
                        <span class="size-2.5 rounded-xs bg-accented/40" :style="item.style" />
                        {{ item.label }}
                    </li>
                </ul>
            </div>
        </template>

        <div class="overflow-x-auto">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Script</th>
                        <th class="w-full">
                            <ol class="flex min-w-xl" aria-hidden="true">
                                <li
                                    v-for="column in months"
                                    :key="column.day"
                                    class="min-w-0 flex-1"
                                >
                                    <span v-if="column.month" class="whitespace-nowrap">
                                        {{ column.month }}
                                    </span>
                                </li>
                            </ol>
                        </th>
                        <th class="numeric">Runs</th>
                        <th class="whitespace-nowrap">Agent / person</th>
                        <th class="numeric">Failed</th>
                        <th class="numeric whitespace-nowrap">Last run</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows" :key="row.name">
                        <td class="font-mono text-xs whitespace-nowrap">{{ row.name }}</td>
                        <td>
                            <DayStrip :days :usage="row.days" :busiest />
                        </td>
                        <td class="numeric font-semibold">{{ row.runs }}</td>
                        <td>
                            <CallerSplit :runs="row.total" :agent="row.agent" />
                        </td>
                        <td
                            class="numeric text-xs"
                            :class="row.failing && 'tone-bad font-semibold'"
                        >
                            {{ row.failed }}
                        </td>
                        <td class="numeric text-xs whitespace-nowrap text-muted">
                            {{ row.last }}
                        </td>
                    </tr>
                </tbody>
                <tfoot class="border-t border-default">
                    <tr>
                        <th scope="row" class="text-xs whitespace-nowrap">All scripts</th>
                        <td>
                            <DayStrip :days :usage="totals" :busiest="busiestTotal" />
                        </td>
                        <td class="numeric font-semibold">{{ total.runs }}</td>
                        <td>
                            <CallerSplit :runs="total.runs" :agent="total.agent" />
                        </td>
                        <td class="numeric text-xs font-semibold">{{ total.failed }}</td>
                        <td />
                    </tr>
                </tfoot>
            </table>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { DayUsage, UsageArtifact } from "#layers/snapshot/shared/types.ts";
import {
    dailyTotals,
    scriptRows,
    sumDays,
    windowDays,
} from "#layers/telemetry/shared/usageView.ts";

interface Props {
    usage: Omit<UsageArtifact, "lint">;
}

const { usage } = defineProps<Props>();

const legend = [
    { label: "Agent", style: { background: "var(--usage-agent)" } },
    { label: "Person", style: { background: "var(--usage-person)" } },
    { label: "A run failed", style: { boxShadow: FAILED_MARK } },
];

const failedShare = ({ runs, failures }: DayUsage): string =>
    runs ? `${percentOf(failures, runs)}%` : "—";

const days = computed(() => windowDays(usage.generatedAt));
const scripts = computed(() => scriptRows(usage));

const rows = computed(() =>
    scripts.value.map((row) => ({
        name: row.name,
        days: row.days,
        runs: row.runs || "—",
        total: row.runs,
        agent: row.agent,
        failing: row.failing,
        failed: failedShare(row),
        last: row.last ? calendarDay(row.last.slice(0, 10)) : "never",
    })),
);

const totals = computed(() => dailyTotals(scripts.value));

const total = computed(() => {
    const sum = sumDays(totals.value);

    return { ...sum, failed: failedShare(sum) };
});

const busiest = computed(() =>
    Math.max(1, ...scripts.value.flatMap((row) => row.days.map((day) => day.runs))),
);
const busiestTotal = computed(() => Math.max(1, ...totals.value.map((day) => day.runs)));

/** A month gets a label on its first day, or at the start when at least a week of it is shown. */
const labelsMonth = (day: string, index: number): boolean => {
    if (day.endsWith("-01")) return true;
    if (index !== 0) return false;

    return days.value.slice(0, 7).every((next) => next.slice(0, 7) === day.slice(0, 7));
};

const months = computed(() =>
    days.value.map((day, index) => ({
        day,
        month: labelsMonth(day, index) ? calendarDay(day, "only") : null,
    })),
);
</script>
