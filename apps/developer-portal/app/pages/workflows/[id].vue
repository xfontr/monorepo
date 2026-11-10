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
                            <code class="font-mono text-default">pnpm workflow:sync {{ id }}</code>
                        </template>
                    </span>
                    <UButton
                        v-if="base"
                        label="Features"
                        icon="i-lucide-settings"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        @click="featuresOpen = true"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="!base || !view" class="p-12 text-center text-sm text-muted">
                No project <code class="font-mono">{{ id }}</code> under
                <code class="font-mono">docs/workflows/projects/</code>.
            </div>

            <div v-else class="flex flex-col gap-6">
                <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div class="flex min-w-0 flex-1 items-center gap-4">
                        <ProgressRing :percent="view.progress.percent" :size="72" />
                        <div class="min-w-0">
                            <p class="text-lg font-semibold">
                                {{ view.progress.done }} of {{ view.progress.total }} done
                            </p>
                            <p class="text-sm text-muted">{{ view.project.summary }}</p>
                            <p class="mt-0.5 flex flex-wrap gap-x-3 text-xs text-dimmed">
                                <span>{{ view.template.title }}</span>
                                <span>Milestone {{ view.project.milestone }}</span>
                                <code v-if="view.project.area" class="font-mono">{{
                                    view.project.area
                                }}</code>
                            </p>
                        </div>
                    </div>
                    <ul class="flex flex-wrap gap-2 text-sm tabular-nums">
                        <li
                            v-for="count in counts"
                            :key="count.state"
                            class="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5"
                            :style="count.style"
                        >
                            <span class="font-semibold" :style="{ color: count.color }">{{
                                count.value
                            }}</span>
                            {{ count.label }}
                        </li>
                    </ul>
                </div>

                <div
                    v-if="range"
                    class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-default px-4 py-2.5"
                >
                    <span class="text-sm font-semibold">Replay</span>
                    <USlider
                        v-model="dayIndex"
                        :min="0"
                        :max="days.length - 1"
                        class="min-w-48 flex-1"
                        aria-label="Day to replay"
                    />
                    <span class="w-28 text-sm font-medium tabular-nums">{{ dayLabel }}</span>
                    <UButton
                        label="Today"
                        color="neutral"
                        variant="outline"
                        size="xs"
                        :disabled="isLatest"
                        @click="dayIndex = days.length - 1"
                    />
                </div>

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

                <section class="flex flex-col gap-2">
                    <h2 class="text-sm font-semibold">
                        What's left
                        <span class="font-normal text-muted tabular-nums">{{
                            view.left.length
                        }}</span>
                    </h2>
                    <ul v-if="view.left.length > 0" class="flex flex-wrap gap-2">
                        <li v-for="chip in leftChips" :key="chip.id">
                            <button
                                type="button"
                                class="flex items-center gap-2 rounded-2xl border px-3 py-1 text-left text-sm transition hover:bg-elevated"
                                :class="
                                    chip.id === selectedId
                                        ? 'border-(--ui-text-highlighted)'
                                        : 'border-default'
                                "
                                @click="select(chip.id)"
                            >
                                <span
                                    class="size-2.5 shrink-0 rounded-full"
                                    :style="{ background: chip.color }"
                                    aria-hidden="true"
                                />
                                <span class="font-medium">{{ chip.title }}</span>
                                <span class="text-xs text-muted">{{ chip.note }}</span>
                            </button>
                        </li>
                        <li
                            v-if="view.left.length > leftChips.length"
                            class="self-center text-xs text-muted"
                        >
                            and {{ view.left.length - leftChips.length }} more
                        </li>
                    </ul>
                    <p v-else class="text-sm text-muted">Everything switched on is done.</p>
                </section>

                <div class="rounded-2xl border border-default bg-elevated/30 p-3 sm:p-6">
                    <WorkflowSkyline
                        :stages="view.stages"
                        :selected="activeStage?.id ?? null"
                        :highlight="selectedId"
                        @select-stage="(stage) => (stageId = stage)"
                        @select="select"
                    />
                    <ActivityStrip
                        v-if="activity"
                        :activity
                        :stages="base.stages"
                        class="mt-6 border-t border-default pt-4"
                    />
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
                />

                <section class="rounded-2xl border border-default">
                    <header
                        class="flex flex-wrap items-start gap-3 border-b border-default px-4 py-3"
                    >
                        <div class="min-w-0 flex-1">
                            <h2 class="text-sm font-semibold">
                                What blocks what<template v-if="selected">
                                    · {{ selected.title }}</template
                                >
                            </h2>
                            <p class="text-xs text-muted">{{ graphNote }}</p>
                        </div>
                        <UButton
                            v-if="selected"
                            label="Details"
                            color="neutral"
                            variant="outline"
                            size="xs"
                            @click="detailsOpen = true"
                        />
                    </header>
                    <WorkflowGraph
                        :capabilities="view.capabilities"
                        :stages="view.stages"
                        :selected="selectedId"
                        class="rounded-t-none"
                        @select="select"
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
                        :titles
                        :activity="activity?.capabilities[selected.id]"
                        @select="select"
                    />
                </template>
            </USlideover>

            <FeaturesModal
                v-if="base"
                v-model:open="featuresOpen"
                :features="base.features"
                :editable
                @toggle="toggle"
            />
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { projectActivity } from "#shared/workflowActivity.ts";
import { projectView, replayRange } from "#shared/workflows.ts";

const LEFT_LIMIT = 10;
const DAY_MS = 86_400_000;

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data } = await useWorkflows();
const { editable, edit } = useWorkflowEdit();

/** The project as synced; the replay lays the same files over an earlier day. */
const base = computed(() => data.value.projects.find(({ project }) => project.id === id.value));
const activity = computed(() => (base.value ? projectActivity(base.value) : null));

useHead({ title: () => base.value?.project.title ?? "Workflow" });

const synced = computed(() => relativeTime(base.value?.syncedAt));
const problems = computed(() =>
    data.value.problems
        .filter(({ file }) => file.startsWith(`projects/${id.value}.`))
        .map(({ file, message }) => `${file}: ${message}`),
);

// ── Replay ────────────────────────────────────────────────────────────────────────────────────────

const range = computed(() => replayRange(base.value?.snapshot ?? null));
const days = computed(() => {
    if (!range.value) return [];

    const first = Date.parse(`${range.value.first}T00:00:00Z`);
    const last = Date.parse(`${range.value.last}T00:00:00Z`);

    return Array.from({ length: Math.round((last - first) / DAY_MS) + 1 }, (_, index) =>
        new Date(first + index * DAY_MS).toISOString().slice(0, 10),
    );
});
const dayIndex = ref(Number.MAX_SAFE_INTEGER);
watch(days, (list) => (dayIndex.value = Math.min(dayIndex.value, list.length - 1)), {
    immediate: true,
});
const isLatest = computed(() => dayIndex.value >= days.value.length - 1);
const dayLabel = computed(() => {
    const day = days.value[dayIndex.value];
    return day ? `${calendarDay(day)}${isLatest.value ? " · today" : ""}` : "";
});

const view = computed(() => {
    const synced = base.value;
    const day = days.value[dayIndex.value];
    if (!synced || isLatest.value || !day) return synced;

    return projectView(synced.project, synced.template, synced.snapshot, day);
});

// ── Selection: one block, picked anywhere, drives the cards, the skyline and the graph ──────────

const counts = computed(() =>
    (["waiting-on-you", "ready", "in-flight", "blocked", "can-file"] as const).map((state) => {
        const color = capabilityColor(state);

        return {
            state,
            color,
            value: view.value?.counts[state] ?? 0,
            label: capabilityStateLabel(state).toLowerCase(),
            style: {
                borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
                background: `color-mix(in oklab, ${color} 12%, transparent)`,
            },
        };
    }),
);

const titles = computed(() =>
    Object.fromEntries(
        (view.value?.capabilities ?? []).map((capability) => [capability.id, capability.title]),
    ),
);

const leftChips = computed(() =>
    (view.value?.left ?? []).slice(0, LEFT_LIMIT).map((capability) => ({
        id: capability.id,
        title: capability.title,
        color: capabilityColor(capability.state),
        note: [
            capabilityStateLabel(capability.state),
            capability.unblockCount > 0 ? `unblocks ${capability.unblockCount}` : "",
        ]
            .filter(Boolean)
            .join(" · "),
    })),
);

const chosenId = ref<string | null>(null);
/** What was picked, else what needs doing first, else the last block on the map. */
const selectedId = computed(() => {
    const capabilities = view.value?.capabilities ?? [];
    const isOn = (capabilityId: string | null) =>
        capabilities.some(({ id: other, state }) => other === capabilityId && state !== "off");

    if (isOn(chosenId.value)) return chosenId.value;
    return (
        view.value?.left[0]?.id ?? capabilities.findLast(({ state }) => state !== "off")?.id ?? null
    );
});
const selected = computed(() =>
    view.value?.capabilities.find((capability) => capability.id === selectedId.value),
);

const stageId = ref<string | null>(null);
const activeIndex = computed(() => {
    const stages = view.value?.stages ?? [];
    const wanted = stageId.value ?? selected.value?.stage;
    return Math.max(
        stages.findIndex((stage) => stage.id === wanted),
        0,
    );
});
const activeStage = computed(() => view.value?.stages[activeIndex.value]);
const selectedStage = computed(
    () => view.value?.stages.find((stage) => stage.id === selected.value?.stage)?.title,
);

const select = (capabilityId: string) => {
    chosenId.value = capabilityId;
    stageId.value = null;
};

const graphNote = computed(() => {
    const current = selected.value;
    if (!current || !view.value) return "";

    const chain = view.value.critical.map((capabilityId) => titles.value[capabilityId]).join(" → ");
    const status = `${capabilityStateLabel(current.state)}. Its path stays lit; drag to move around.`;

    return chain ? `${status} Longest chain left: ${chain}.` : status;
});

const detailsOpen = ref(false);
const featuresOpen = ref(false);

const toggle = (capability: string, on: boolean) =>
    edit({ action: "switch", project: id.value, capability, on });
</script>
