<template>
    <figure class="flex flex-col gap-1.5">
        <figcaption
            class="flex flex-wrap items-baseline justify-between gap-x-4 text-2xs text-dimmed"
            title="Capabilities moved per day, from commits tagged with a ticket number"
        >
            <span class="font-semibold text-muted">Activity</span>
            <span class="tabular-nums">Last commit {{ lastCommit }}</span>
        </figcaption>

        <ol class="flex flex-col gap-0.75">
            <li
                v-for="lane in lanes"
                :key="lane.stage"
                class="flex h-0.75 overflow-hidden rounded-full bg-accented/40"
                :title="lane.title"
            >
                <span
                    v-for="day in lane.days"
                    :key="day.day"
                    class="min-w-0 flex-1"
                    :style="day.moved > 0 && { background: lane.color, opacity: day.opacity }"
                    :title="day.label"
                />
            </li>
        </ol>

        <ol class="flex text-2xs text-dimmed" aria-hidden="true">
            <li v-for="column in months" :key="column.day" class="min-w-0 flex-1">
                <span v-if="column.month" class="whitespace-nowrap">{{ column.month }}</span>
            </li>
        </ol>
    </figure>
</template>

<script setup lang="ts">
import type { ProjectActivity } from "#layers/workflows/shared/workflowActivity.ts";
import type { StageView } from "#layers/workflows/shared/workflows.ts";

interface Props {
    activity: ProjectActivity;
    stages: StageView[];
}

const { activity, stages } = defineProps<Props>();

const lastCommit = computed(() => calendarDay(activity.lastDay));

/** A month gets a label on its first day, or at the start when at least a week of it is shown. */
const labelsMonth = (day: string, index: number): boolean => {
    if (day.endsWith("-01")) return true;
    if (index !== 0) return false;

    return activity.days.slice(0, 7).every((next) => next.slice(0, 7) === day.slice(0, 7));
};

const months = computed(() =>
    activity.days.map((day, index) => ({
        day,
        month: labelsMonth(day, index) ? calendarDay(day, "only") : null,
    })),
);

/** Lanes run in stage order and share one scale, so a busy day reads the same in every lane. */
const lanes = computed(() => {
    const busiest = Math.max(1, ...activity.byStage.flat());

    return stages.map((stage, stageIndex) => ({
        stage: stage.id,
        title: stage.title,
        color: stageColor(stageIndex),
        days: activity.days.map((day, index) => {
            const moved = activity.byStage[index]?.[stageIndex] ?? 0;

            return {
                day,
                moved,
                opacity: 0.45 + 0.55 * (moved / busiest),
                label: `${stage.title} · ${calendarDay(day)} · ${moved} ${moved === 1 ? "capability" : "capabilities"}`,
            };
        }),
    }));
});
</script>
