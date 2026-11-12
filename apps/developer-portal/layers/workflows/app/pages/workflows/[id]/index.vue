<template>
    <UDashboardPanel id="workflow">
        <template #header>
            <UDashboardNavbar :title="base?.project.title ?? 'Workflow'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="flex items-center gap-1.5 text-xs text-muted">
                        <UIcon name="i-lucide-refresh-cw" class="size-3.5" />
                        <template v-if="base?.syncedAt">Snapshot updated {{ synced }}</template>
                        <template v-else>
                            Never synced — run
                            <code class="font-mono text-default">pnpm workflow:setup {{ id }}</code>
                            then
                            <code class="font-mono text-default">pnpm workflow:sync {{ id }}</code>
                        </template>
                    </span>
                    <UButton
                        v-if="base"
                        :to="`/workflows/${id}/settings`"
                        label="Settings"
                        icon="i-lucide-settings"
                        color="neutral"
                        variant="outline"
                        size="sm"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="!base || !view" class="p-12 text-center text-sm text-muted">
                No project <code class="font-mono">{{ id }}</code> under
                <code class="font-mono">data/workflows/projects/</code>.
            </div>

            <div v-else class="flex flex-col gap-6">
                <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div class="flex min-w-0 flex-1 items-center gap-4">
                        <ProgressRing :percent="view.progress.percent" :size="72" />
                        <div class="min-w-0">
                            <p class="text-lg font-semibold">
                                {{ view.progress.done }} of {{ view.progress.total }} done
                            </p>
                            <p class="text-sm tabular-nums">{{ pointsText }}</p>
                            <p class="text-sm text-muted">{{ view.project.summary }}</p>
                            <p class="mt-0.5 flex flex-wrap gap-x-3 text-xs text-dimmed">
                                <span>{{ view.template.title }}</span>
                                <span>Milestone {{ view.project.milestone }}</span>
                                <span class="tabular-nums">{{ ticketLine }}</span>
                                <code v-if="view.project.area" class="font-mono">{{
                                    view.project.area
                                }}</code>
                            </p>
                        </div>
                    </div>
                    <ul v-if="leftByState.length > 0" class="flex flex-wrap gap-2 text-sm">
                        <li v-for="group in leftByState" :key="group.state">
                            <UPopover v-model:open="openStates[group.state]">
                                <button
                                    type="button"
                                    class="flex items-center gap-1.5 rounded-full border border-(--state)/40 bg-(--state)/12 px-2.5 py-0.5 tabular-nums transition hover:bg-(--state)/24"
                                    :style="{ '--state': group.color }"
                                >
                                    <span class="font-semibold text-(--state)">{{
                                        group.blocks.length
                                    }}</span>
                                    {{ group.label }}
                                    <UIcon name="i-lucide-chevron-down" class="size-3.5" />
                                </button>
                                <template #content>
                                    <ul
                                        class="flex max-h-80 w-72 flex-col overflow-y-auto p-1"
                                        :aria-label="`${group.label} blocks`"
                                    >
                                        <li v-for="block in group.blocks" :key="block.id">
                                            <button
                                                type="button"
                                                class="flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
                                                :class="block.id === selectedId && 'font-semibold'"
                                                @click="pick(group.state, block.id)"
                                            >
                                                <span class="min-w-0 flex-1 truncate">{{
                                                    block.title
                                                }}</span>
                                                <span
                                                    v-if="block.unblockCount > 0"
                                                    class="shrink-0 text-xs text-muted tabular-nums"
                                                >
                                                    unblocks {{ block.unblockCount }}
                                                </span>
                                            </button>
                                        </li>
                                    </ul>
                                </template>
                            </UPopover>
                        </li>
                    </ul>
                    <p v-else-if="blank" class="text-sm text-muted">No blocks yet.</p>
                    <p v-else class="text-sm text-muted">Everything switched on is done.</p>
                </div>

                <UAlert
                    v-if="blank"
                    color="info"
                    variant="subtle"
                    icon="i-lucide-map"
                    title="This project has no blocks yet"
                >
                    <template #description>
                        Ask Claude to draft its map: it asks what the project is, writes the blocks
                        under <code class="font-mono">extras</code> in
                        <code class="font-mono">data/workflows/projects/{{ id }}.yaml</code>, and
                        they show here for you to check before anything is filed.
                    </template>
                </UAlert>

                <UAlert
                    v-if="problems.length > 0"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-triangle-alert"
                    title="This project's files have problems"
                >
                    <template #description>
                        <ul class="list-disc pl-4">
                            <li v-for="problem in problems" :key="problem">{{ problem }}</li>
                        </ul>
                    </template>
                </UAlert>

                <UAlert
                    v-if="isLatest && view.unsorted.length > 0"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-inbox"
                    :title="`${view.unsorted.length} to organise`"
                >
                    <template #description>
                        <p>
                            Not placed yet. Give each one the milestone and a
                            <code class="font-mono">cap:&lt;capability&gt;</code> label on GitHub,
                            then sync again.
                        </p>
                        <ul class="mt-2 flex flex-col gap-1">
                            <li
                                v-for="{ issue, reason } in view.unsorted"
                                :key="issue.number"
                                class="flex items-center gap-3"
                            >
                                <a
                                    :href="issue.url"
                                    target="_blank"
                                    class="font-mono text-xs text-dimmed"
                                >
                                    #{{ issue.number }}
                                </a>
                                <span class="min-w-0 flex-1 truncate text-default">{{
                                    issue.title
                                }}</span>
                                <span class="text-xs">{{ reason }}</span>
                            </li>
                        </ul>
                    </template>
                </UAlert>

                <div class="rounded-2xl border border-default bg-elevated/50 p-3 sm:p-6">
                    <WorkflowSkyline
                        :stages="view.stages"
                        :selected="activeStage?.id ?? null"
                        :highlight="selectedId"
                        @select-stage="(stage) => (stageId = stage)"
                        @select="select"
                    />
                    <button
                        v-if="selected && selectedLabel"
                        type="button"
                        class="mt-3 flex max-w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-xs text-muted transition hover:bg-elevated hover:text-default"
                        :style="{ '--state': selectedLabel.color }"
                        @click="scrollToBlock(selected.id)"
                    >
                        <span class="size-2 shrink-0 rounded-xs bg-(--state)" aria-hidden="true" />
                        <span class="truncate font-semibold text-default">{{
                            selected.title
                        }}</span>
                        <span class="shrink-0">{{ selectedLabel.state }}</span>
                        <UIcon name="i-lucide-arrow-down" class="size-3.5 shrink-0" />
                    </button>
                    <div
                        v-if="activity || range"
                        class="mt-4 flex flex-wrap items-start gap-x-8 gap-y-3 border-t border-default pt-3"
                    >
                        <ActivityStrip
                            v-if="activity"
                            :activity
                            :stages="base.stages"
                            class="w-full shrink-0 sm:w-80"
                        />
                        <div v-if="range" class="flex min-w-48 flex-1 flex-col gap-1">
                            <span
                                class="flex items-baseline justify-between gap-x-4 text-2xs text-dimmed"
                            >
                                <span class="font-semibold text-muted">Replay</span>
                                <output class="tabular-nums">{{ dayLabel }}</output>
                            </span>
                            <span class="flex h-6 items-center gap-2">
                                <USlider
                                    v-model="dayIndex"
                                    :min="0"
                                    :max="days.length - 1"
                                    size="xs"
                                    class="flex-1"
                                    aria-label="Day to replay"
                                />
                                <UButton
                                    label="Today"
                                    color="neutral"
                                    variant="ghost"
                                    size="xs"
                                    :disabled="isLatest"
                                    @click="dayIndex = days.length - 1"
                                />
                            </span>
                        </div>
                    </div>
                </div>

                <StageCards
                    v-if="activeStage"
                    :stage="activeStage"
                    :index="activeIndex"
                    :selected="selectedId"
                    :titles
                    :activity="activity?.capabilities"
                    :activity-peak="activity?.peak"
                    @select="select"
                    @details="openDetails"
                />

                <section class="rounded-2xl border border-default">
                    <header
                        class="flex flex-wrap items-start gap-3 border-b border-default px-4 py-3"
                    >
                        <div class="min-w-0 flex-1">
                            <h2 class="text-sm font-semibold">
                                Dependency graph<template v-if="selected">
                                    · {{ selected.title }}</template
                                >
                            </h2>
                            <p class="text-xs text-muted">{{ graphNote }}</p>
                        </div>
                    </header>
                    <WorkflowGraph
                        :capabilities="view.capabilities"
                        :stages="view.stages"
                        :selected="selectedId"
                        class="rounded-t-none"
                        @select="select"
                        @details="openDetails"
                    />
                </section>
            </div>

            <USlideover
                v-model:open="detailsOpen"
                :title="selected?.title"
                :description="selectedStage"
            >
                <template #body>
                    <CapabilityDetail
                        v-if="selected"
                        :capability="selected"
                        :project="id"
                        :titles
                        :activity="activity?.capabilities[selected.id]"
                        @select="select"
                    />
                </template>
            </USlideover>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import {
    pointsLine,
    type CapabilityState,
    type CapabilityView,
} from "#layers/workflows/shared/workflows.ts";
import { projectActivity } from "#layers/workflows/shared/workflowActivity.ts";

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data } = await useWorkflows();

/** The project as synced; the replay lays the same files over an earlier day. */
const base = computed(() => data.value.projects.find(({ project }) => project.id === id.value));

useHead({ title: () => base.value?.project.title ?? "Workflow" });

const synced = computed(() => relativeTime(base.value?.syncedAt));
const problems = computed(() =>
    data.value.problems
        .filter(({ file }) => file.startsWith(`projects/${id.value}.`))
        .map(({ file, message }) => `${file}: ${message}`),
);

const { range, days, dayIndex, isLatest, dayLabel, view } = useProjectReplay(base);
const syncedActivity = computed(() => (base.value ? projectActivity(base.value) : null));
const activity = computed(() =>
    view.value && syncedActivity.value ? projectActivity(view.value, syncedActivity.value) : null,
);

const blank = computed(() => view.value?.capabilities.every(({ enabled }) => !enabled) ?? false);

/** Every unfinished block under its state, in the order `left` already ranks them. */
const leftByState = computed(() => {
    const groups = new Map<CapabilityState, CapabilityView[]>();
    for (const block of view.value?.left ?? []) {
        groups.set(block.state, [...(groups.get(block.state) ?? []), block]);
    }

    return [...groups].map(([state, blocks]) => ({
        state,
        blocks,
        color: capabilityColor(state),
        label: capabilityStateLabel(state).toLowerCase(),
    }));
});

const titles = computed(() =>
    Object.fromEntries(
        (view.value?.capabilities ?? []).map((capability) => [capability.id, capability.title]),
    ),
);

const { selectedId, selected, stageId, activeIndex, activeStage, selectedStage, select } =
    useCapabilitySelection(view);

const openStates = ref<Partial<Record<CapabilityState, boolean>>>({});
const pick = (state: CapabilityState, capabilityId: string) => {
    openStates.value[state] = false;
    select(capabilityId);
};

const graphNote = computed(() => {
    const current = selected.value;
    if (!current || !view.value) return "";

    const chain = view.value.critical.map((capabilityId) => titles.value[capabilityId]).join(" → ");
    const status = `${capabilityStateLabel(current.state)}. Its path stays lit; drag to move around.`;

    return chain ? `${status} Longest chain left: ${chain}.` : status;
});

const selectedLabel = computed(() =>
    selected.value
        ? {
              color: capabilityColor(selected.value.state),
              state: capabilityStateLabel(selected.value.state),
          }
        : null,
);

const flash = [
    { boxShadow: "0 0 0 0 var(--ui-text-highlighted)" },
    { boxShadow: "0 0 0 3px var(--ui-text-highlighted)" },
    { boxShadow: "0 0 0 0 var(--ui-text-highlighted)" },
];

const scrollToBlock = (capabilityId: string) => {
    const card = document.getElementById(`block-${capabilityId}`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.animate(flash, { duration: 500, delay: 350, iterations: 2, easing: "ease-in-out" });
};

const detailsOpen = ref(false);
const openDetails = (capabilityId: string) => {
    select(capabilityId);
    detailsOpen.value = true;
};

const pointsText = computed(() => (view.value ? pointsLine(view.value.points) : ""));

const ticketLine = computed(() => {
    if (!view.value) return "";

    const { progress, tickets, project } = view.value;
    return `${progress.total} blocks · ${tickets.filed} tickets filed · ${tickets.toFile[project.ticketSize]} to file`;
});
</script>
