<template>
    <section :id="`stage-${stage.id}`" class="flex flex-col gap-4">
        <header class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 class="flex items-center gap-2 text-2xl font-bold">
                <span
                    class="size-3 rounded-full"
                    :style="{ background: color }"
                    aria-hidden="true"
                />
                {{ stage.title }}
            </h2>
            <p class="text-sm text-muted tabular-nums">
                {{ stage.progress.done }} of {{ stage.progress.total }}
            </p>
            <StatusPill
                v-if="stage.approvedOn"
                :label="`Gate approved ${stage.approvedOn}`"
                tone="good"
            />
            <StatusPill v-else-if="ready" label="Ready for its gate" tone="warn" />
            <UButton
                v-if="editable && (stage.approvedOn || stage.state === 'current')"
                :label="stage.approvedOn ? 'Reopen' : 'Approve today'"
                size="xs"
                color="neutral"
                variant="outline"
                @click="emit('approve', stage.id, stage.approvedOn === null)"
            />
            <p class="basis-full text-sm text-muted">
                <span class="font-medium text-default">Gate:</span> {{ stage.gate }}
            </p>
        </header>

        <div
            v-for="block in blocks"
            :key="block.key"
            class="flex flex-col gap-3"
            :class="{ 'mt-3': block.group }"
        >
            <div v-if="block.group" class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 class="flex items-center gap-1.5 text-sm font-semibold">
                    <UIcon name="i-lucide-layers" class="size-4 text-dimmed" />
                    {{ block.group.title }}
                </h3>
                <span class="text-xs text-muted">{{ block.note }}</span>
                <USwitch
                    v-if="editable && block.group.optional"
                    :model-value="block.group.enabled"
                    size="sm"
                    :aria-label="`${block.group.title} in this project`"
                    @update:model-value="(on) => emit('toggle-group', block.group!.id, on)"
                />
            </div>

            <ul class="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
                <li v-for="capability in block.capabilities" :key="capability.id" class="contents">
                    <button
                        type="button"
                        class="relative flex min-h-24 flex-col gap-1 overflow-hidden rounded-2xl border bg-elevated/40 py-4 pr-4 pl-6 text-left transition hover:-translate-y-0.5 hover:bg-elevated"
                        :class="cardClass(capability.state)"
                        :style="{ '--state': capabilityColor(capability.state) }"
                        @click="emit('select', capability.id)"
                        @mouseenter="emit('hover', capability.id)"
                        @mouseleave="emit('hover', null)"
                        @focus="emit('hover', capability.id)"
                        @blur="emit('hover', null)"
                    >
                        <span
                            class="absolute inset-y-0 left-0 w-1.5 bg-(--state)"
                            aria-hidden="true"
                        />
                        <span class="text-base leading-tight font-semibold">{{
                            capability.title
                        }}</span>
                        <span class="text-xs font-semibold text-(--state)">{{
                            capabilityStateLabel(capability.state)
                        }}</span>
                        <span
                            v-if="activityOf[capability.id]?.quiet"
                            class="tone-warn flex items-center gap-1 text-xs"
                        >
                            <UIcon name="i-lucide-moon" class="size-3.5" />
                            {{ activityOf[capability.id]?.quiet }}
                        </span>
                        <span class="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                            <span
                                v-for="issue in capability.issues"
                                :key="issue.number"
                                class="size-2.5 rounded-full"
                                :class="ticketClass(issue)"
                                :title="`#${issue.number} ${issue.title}`"
                            />
                            <span
                                v-if="capability.issues.length === 0 && capability.state === 'todo'"
                                class="text-xs text-dimmed"
                                >No ticket yet</span
                            >
                            <ActivitySpark
                                v-if="activityOf[capability.id]?.weeks"
                                :weeks="activityOf[capability.id]!.weeks!"
                                :peak="activityPeak"
                                :label="activityOf[capability.id]!.label"
                                class="ml-auto"
                                :style="{ color }"
                            />
                            <span
                                v-else-if="activityOf[capability.id]"
                                class="ml-auto text-xs text-dimmed"
                                >No commits</span
                            >
                        </span>
                    </button>
                </li>
            </ul>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { CapabilityActivity } from "#shared/workflowActivity.ts";
import type { CapabilityState, GroupView, SnapshotIssue, StageView } from "#shared/workflows.ts";

interface Props {
    stage: StageView;
    /** The stage's place in the template, which picks its colour. */
    index: number;
    editable?: boolean;
    /** Keyed by capability id; absent when no commit names any of the project's tickets. */
    activity?: Record<string, CapabilityActivity> | null;
    /** The busiest week any capability had, so every card's line shares one scale. */
    activityPeak?: number;
    groups?: GroupView[];
}

const {
    stage,
    index,
    editable = false,
    activity = null,
    activityPeak = 1,
    groups = [],
} = defineProps<Props>();
const emit = defineEmits<{
    select: [capability: string];
    hover: [capability: string | null];
    approve: [stage: string, approving: boolean];
    "toggle-group": [group: string, on: boolean];
}>();

const color = computed(() => stageColor(index));

/** Capabilities outside any group first, then each group's under its own heading, in template order. */
const blocks = computed(() => {
    const loose = stage.capabilities.filter((capability) => !capability.group);
    const grouped = groups.flatMap((group) => {
        const members = stage.capabilities.filter((capability) => capability.group === group.id);
        if (members.length === 0) return [];

        return [
            {
                key: group.id,
                group,
                note: group.enabled ? group.summary : "Off for this project",
                capabilities: members,
            },
        ];
    });

    return [
        ...(loose.length > 0 ? [{ key: "", group: null, note: "", capabilities: loose }] : []),
        ...grouped,
    ];
});

/** Only a capability with tickets gets a line or a "No commits", so an unstarted one stays quiet. */
const activityOf = computed(() =>
    Object.fromEntries(
        stage.capabilities.flatMap((capability) => {
            const found = activity?.[capability.id];
            if (!found || capability.issues.length === 0) return [];

            return [
                [
                    capability.id,
                    {
                        weeks: found.days > 0 ? found.weeks : null,
                        label: `Active on ${found.days} days, last on ${found.lastDay ? calendarDay(found.lastDay) : "never"}`,
                        quiet: found.quietSince
                            ? `Quiet since ${calendarDay(found.quietSince)}`
                            : null,
                    },
                ],
            ];
        }),
    ),
);
const ready = computed(
    () =>
        stage.state === "current" &&
        stage.progress.total > 0 &&
        stage.progress.done === stage.progress.total,
);

const cardClass = (state: CapabilityState): string => {
    if (state === "in-progress") return "border-2 border-(--state)";
    if (state === "off") return "border-dashed border-default opacity-50";
    return "border-default";
};

const ticketClass = (issue: SnapshotIssue): string => {
    if (issue.state === "open") return "bg-(--tone-warn)";
    return issue.reason === "not_planned" ? "bg-(--ui-text-dimmed)" : "bg-(--tone-good)";
};
</script>
