<template>
    <section class="flex flex-col gap-3" aria-labelledby="map-heading">
        <header class="flex flex-col gap-2">
            <h2 id="map-heading" class="text-sm font-semibold">Map</h2>
            <p class="max-w-3xl text-xs text-muted">
                A block sits one column right of the latest block it needs, so each column is what
                can run side by side. Hover or focus a block to light up what it needs and what it
                unblocks.
            </p>
            <ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <li
                    v-for="(stage, index) in stages"
                    :key="stage.id"
                    class="flex items-center gap-1.5"
                >
                    <span
                        class="size-2.5 rounded-full"
                        :style="{ background: stageColor(index) }"
                        aria-hidden="true"
                    />
                    {{ stage.title }}
                </li>
                <li class="flex items-center gap-1.5">
                    <UIcon :name="SPIKE_ICON" class="size-3.5" /> Spike
                </li>
                <li class="flex items-center gap-1.5">
                    <UIcon :name="OWNER_ICON" class="size-3.5" /> Yours
                </li>
            </ul>
            <ul
                v-if="editable && optionalGroups.length > 0"
                class="flex flex-wrap items-center gap-4 text-xs"
            >
                <li v-for="group in optionalGroups" :key="group.id">
                    <USwitch
                        :model-value="group.enabled"
                        size="sm"
                        :label="`${group.title} in this project`"
                        @update:model-value="(on) => emit('toggle-group', group.id, on)"
                    />
                </li>
            </ul>
        </header>

        <ol class="flex gap-3 overflow-x-auto pb-2">
            <li
                v-for="(wave, index) in waves"
                :key="index"
                class="flex w-52 shrink-0 flex-col gap-2"
                :data-wave="index"
            >
                <p class="text-xs font-semibold text-dimmed">Wave {{ index + 1 }}</p>

                <button
                    v-for="capability in wave"
                    :key="capability.id"
                    type="button"
                    class="relative flex flex-col gap-1 overflow-hidden rounded-xl border bg-elevated/40 py-2.5 pr-3 pl-4 text-left text-sm transition hover:bg-elevated"
                    :class="cardClass(capability)"
                    :style="{ '--state': capabilityColor(capability.state) }"
                    :data-capability="capability.id"
                    :data-relation="relationOf(capability.id)"
                    @click="emit('select', capability.id)"
                    @mouseenter="emit('hover', capability.id)"
                    @mouseleave="emit('hover', null)"
                    @focus="emit('hover', capability.id)"
                    @blur="emit('hover', null)"
                >
                    <span
                        class="absolute inset-y-0 left-0 w-1"
                        :style="{ background: stageColors[capability.stage] }"
                        aria-hidden="true"
                    />
                    <span class="flex items-start gap-1.5 font-semibold leading-tight">
                        <UIcon
                            v-if="blockKindIcon(capability.kind)"
                            :name="blockKindIcon(capability.kind)!"
                            class="mt-0.5 size-3.5 shrink-0 text-dimmed"
                            :aria-label="blockKindLabel(capability.kind)"
                        />
                        {{ capability.title }}
                    </span>
                    <span class="text-xs font-semibold text-(--state)">
                        {{ capabilityStateLabel(capability.state) }}
                        <span v-if="relationOf(capability.id)" class="font-normal text-muted">
                            · {{ relationOf(capability.id) }}
                        </span>
                    </span>
                    <span v-if="capability.waitsOn.length > 0" class="text-xs text-muted">
                        on {{ capability.waitsOn.map((id) => titles[id] ?? id).join(", ") }}
                    </span>
                    <span
                        v-if="capability.issues.length > 0 || activityOf[capability.id]"
                        class="mt-1 flex flex-wrap items-center gap-1"
                    >
                        <span
                            v-for="issue in capability.issues"
                            :key="issue.number"
                            class="size-2 rounded-full"
                            :class="ticketClass(issue)"
                            :title="`#${issue.number} ${issue.title}`"
                        />
                        <ActivitySpark
                            v-if="activityOf[capability.id]"
                            :weeks="activityOf[capability.id]!.weeks"
                            :peak="activityPeak"
                            :label="activityOf[capability.id]!.label"
                            class="ml-auto"
                            :style="{ color: stageColors[capability.stage] }"
                        />
                    </span>
                </button>
            </li>
        </ol>
    </section>
</template>

<script setup lang="ts">
import type { CapabilityActivity } from "#shared/workflowActivity.ts";
import type { CapabilityView, GroupView, SnapshotIssue, StageView } from "#shared/workflows.ts";

interface Props {
    waves: CapabilityView[][];
    stages: StageView[];
    /** The capability whose links are lit, hovered or selected. */
    focus?: string | null;
    editable?: boolean;
    groups?: GroupView[];
    /** Keyed by capability id; absent when no commit names any of the project's tickets. */
    activity?: Record<string, CapabilityActivity> | null;
    /** The busiest week any capability had, so every card's line shares one scale. */
    activityPeak?: number;
}

const {
    waves,
    stages,
    focus = null,
    editable = false,
    groups = [],
    activity = null,
    activityPeak = 1,
} = defineProps<Props>();
const emit = defineEmits<{
    select: [capability: string];
    hover: [capability: string | null];
    "toggle-group": [group: string, on: boolean];
}>();

const SPIKE_ICON = blockKindIcon("spike") ?? undefined;
const OWNER_ICON = blockKindIcon("owner") ?? undefined;

const all = computed(() => waves.flat());
const titles = computed(() =>
    Object.fromEntries(all.value.map((capability) => [capability.id, capability.title])),
);
const stageColors = computed(() =>
    Object.fromEntries(stages.map((stage, index) => [stage.id, stageColor(index)])),
);
const optionalGroups = computed(() => groups.filter((group) => group.optional));

const focused = computed(() => all.value.find((capability) => capability.id === focus));

const relationOf = (id: string): string | null => {
    if (!focused.value || id === focused.value.id) return null;
    if (focused.value.dependsOn.includes(id)) return "needed";
    if (focused.value.unblocks.includes(id)) return "unblocked by it";
    return null;
};

const cardClass = (capability: CapabilityView): string[] => [
    capability.state === "in-progress" ? "border-2 border-(--state)" : "border-default",
    capability.state === "off" ? "border-dashed opacity-50" : "",
    capability.id === focus ? "ring-2 ring-(--ui-primary)" : "",
    focused.value && capability.id !== focus && !relationOf(capability.id) ? "opacity-40" : "",
];

/** Only a capability with commits gets a line, so an unstarted one stays quiet. */
const activityOf = computed(() =>
    Object.fromEntries(
        all.value.flatMap((capability) => {
            const found = activity?.[capability.id];
            if (!found || found.days === 0 || capability.issues.length === 0) return [];

            return [
                [
                    capability.id,
                    {
                        weeks: found.weeks,
                        label: `Active on ${found.days} days, last on ${found.lastDay ? calendarDay(found.lastDay) : "never"}`,
                    },
                ],
            ];
        }),
    ),
);

const ticketClass = (issue: SnapshotIssue): string => {
    if (issue.state === "open") return "bg-(--tone-warn)";
    return issue.reason === "not_planned" ? "bg-(--ui-text-dimmed)" : "bg-(--tone-good)";
};
</script>
