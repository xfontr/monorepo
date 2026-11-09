<template>
    <figure class="flex flex-col gap-2">
        <figcaption
            class="flex flex-wrap items-baseline justify-between gap-x-4 text-xs text-muted"
        >
            <span>
                <span class="font-semibold text-default">Activity</span> · capabilities moved per
                day, from commits tagged with a ticket number
            </span>
            <span class="tabular-nums">Last commit {{ lastCommit }}</span>
        </figcaption>

        <ol class="flex h-20 items-end gap-px">
            <li
                v-for="column in columns"
                :key="column.day"
                class="flex h-full min-w-0 flex-1 flex-col-reverse"
            >
                <span
                    v-for="segment in column.segments"
                    :key="segment.stage"
                    class="segment w-full first:rounded-b-sm last:rounded-t-sm"
                    :style="{ height: `${segment.share}%`, background: segment.color }"
                    :title="segment.label"
                />
            </li>
        </ol>

        <ol class="flex gap-px text-[0.625rem] text-dimmed" aria-hidden="true">
            <li v-for="column in columns" :key="column.day" class="min-w-0 flex-1">
                <span v-if="column.month" class="whitespace-nowrap">{{ column.month }}</span>
            </li>
        </ol>
    </figure>
</template>

<script setup lang="ts">
import type { ProjectActivity } from "#shared/workflowActivity.ts";
import type { StageView } from "#shared/workflows.ts";

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

/** Segments stack bottom to top in skyline order, so a day's colours run the way the stages do. */
const columns = computed(() => {
    const tallest = Math.max(
        1,
        ...activity.byStage.map((day) => day.reduce((sum, moved) => sum + moved, 0)),
    );

    return activity.days.map((day, index) => ({
        day,
        month: labelsMonth(day, index) ? calendarDay(day, "only") : null,
        segments: stages.flatMap((stage, stageIndex) => {
            const moved = activity.byStage[index]?.[stageIndex] ?? 0;

            return moved === 0
                ? []
                : [
                      {
                          stage: stage.id,
                          color: stageColor(stageIndex),
                          share: (moved / tallest) * 100,
                          label: `${stage.title} · ${calendarDay(day)} · ${moved} ${moved === 1 ? "capability" : "capabilities"}`,
                      },
                  ];
        }),
    }));
});
</script>

<style scoped>
.segment {
    transition: filter 0.15s;
}

.segment:hover {
    filter: brightness(1.2) saturate(1.2);
}
</style>
