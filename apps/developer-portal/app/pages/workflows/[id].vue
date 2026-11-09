<template>
    <UDashboardPanel id="workflow">
        <template #header>
            <UDashboardNavbar :title="view?.project.title ?? 'Workflow'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="flex items-center gap-1.5 text-xs text-muted">
                        <UIcon name="i-lucide-refresh-cw" class="size-3.5" />
                        <template v-if="view?.syncedAt">Snapshot updated {{ synced }}</template>
                        <template v-else>
                            Never synced — run
                            <code class="font-mono text-default">pnpm workflow:sync {{ id }}</code>
                        </template>
                    </span>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="!view" class="p-12 text-center text-sm text-muted">
                No project <code class="font-mono">{{ id }}</code> under
                <code class="font-mono">docs/workflows/projects/</code>.
            </div>

            <div v-else class="flex flex-col gap-6">
                <div class="flex items-center gap-4">
                    <ProgressRing :percent="view.progress.percent" :size="72" />
                    <div class="min-w-0 flex-1">
                        <p class="text-lg font-semibold">
                            {{ view.progress.done }} of {{ view.progress.total }} done
                            <span class="text-muted font-normal">· {{ current }}</span>
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
                    v-if="view.unsorted.length > 0"
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

                <section v-if="view.left.length > 0" class="flex flex-col gap-2">
                    <h2 class="text-sm font-semibold">
                        What's left
                        <span class="font-normal text-muted tabular-nums">
                            {{ view.left.length }}
                        </span>
                    </h2>
                    <ul class="flex flex-wrap gap-2">
                        <li v-for="capability in leftShown" :key="capability.id">
                            <button
                                type="button"
                                class="flex items-center gap-2 rounded-2xl border border-default px-3 py-1 text-left text-sm transition hover:bg-elevated"
                                @click="selectedId = capability.id"
                                @mouseenter="highlight = capability.id"
                                @mouseleave="highlight = null"
                                @focus="highlight = capability.id"
                                @blur="highlight = null"
                            >
                                <span
                                    class="size-2.5 shrink-0 rounded-full border-2"
                                    :style="{
                                        borderColor: capabilityColor(capability.state),
                                        background: capabilityFilled(capability.state)
                                            ? capabilityColor(capability.state)
                                            : 'transparent',
                                    }"
                                    aria-hidden="true"
                                />
                                <span class="flex flex-wrap items-baseline gap-x-2">
                                    <span class="font-medium">{{ capability.title }}</span>
                                    <span class="text-xs text-muted">
                                        {{ stageTitles.get(capability.stage) }} ·
                                        {{ capabilityStateLabel(capability.state) }}
                                    </span>
                                </span>
                            </button>
                        </li>
                        <li
                            v-if="view.left.length > leftShown.length"
                            class="self-center text-xs text-muted"
                        >
                            and {{ view.left.length - leftShown.length }} more in later stages
                        </li>
                    </ul>
                </section>

                <div class="rounded-2xl border border-default bg-elevated/30 p-3 sm:p-6">
                    <WorkflowSkyline
                        :stages="view.stages"
                        :selected="activeId"
                        :highlight
                        @select-stage="(stage) => (stageId = stage)"
                        @select="(capability) => (selectedId = capability)"
                    />
                    <ActivityStrip
                        v-if="activity"
                        :activity
                        :stages="view.stages"
                        class="mt-6 border-t border-default pt-4"
                    />
                </div>

                <StageCards
                    v-if="activeStage"
                    :stage="activeStage"
                    :index="activeIndex"
                    :editable
                    :activity="activity?.capabilities"
                    :activity-peak="activity?.peak"
                    :groups="view.groups"
                    @toggle-group="toggle"
                    @select="(capability) => (selectedId = capability)"
                    @hover="(capability) => (highlight = capability)"
                    @approve="approve"
                />
            </div>

            <USlideover
                :open="selected !== undefined"
                :title="selected?.title"
                :description="selectedStage"
                @update:open="(open) => !open && (selectedId = null)"
            >
                <template #body>
                    <CapabilityDetail
                        v-if="selected"
                        :capability="selected"
                        :editable
                        :activity="activity?.capabilities[selected.id]"
                        :group-off="selectedGroupOff"
                        @toggle="(on) => toggle(selected!.id, on)"
                    />
                </template>
            </USlideover>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { projectActivity } from "#shared/workflowActivity.ts";

const LEFT_LIMIT = 8;

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data } = await useWorkflows();
const { editable, edit } = useWorkflowEdit();

const view = computed(() => data.value.projects.find(({ project }) => project.id === id.value));
const activity = computed(() => (view.value ? projectActivity(view.value) : null));

useHead({ title: () => view.value?.project.title ?? "Workflow" });

const synced = computed(() => relativeTime(view.value?.syncedAt));
const current = computed(() => {
    const stage = view.value?.stages.find(({ state }) => state === "current");
    return stage ? `now in ${stage.title}` : "every gate approved";
});
const problems = computed(() =>
    data.value.problems
        .filter(({ file }) => file.startsWith(`projects/${id.value}.`))
        .map(({ file, message }) => `${file}: ${message}`),
);

const stageTitles = computed(
    () => new Map(view.value?.stages.map((stage) => [stage.id, stage.title])),
);

const stageId = ref<string | null>(null);
const highlight = ref<string | null>(null);

const activeIndex = computed(() => {
    const stages = view.value?.stages ?? [];
    const chosen = stages.findIndex((stage) => stage.id === stageId.value);
    const current = stages.findIndex((stage) => stage.state === "current");

    return Math.max(chosen >= 0 ? chosen : current, 0);
});
const activeStage = computed(() => view.value?.stages[activeIndex.value]);
const activeId = computed(() => activeStage.value?.id ?? null);

/** A fresh project owes every capability, so the list stops at what the next stages need. */
const leftShown = computed(() => view.value?.left.slice(0, LEFT_LIMIT) ?? []);

const selectedId = ref<string | null>(null);
const selected = computed(() =>
    view.value?.stages
        .flatMap((stage) => stage.capabilities)
        .find((capability) => capability.id === selectedId.value),
);
const selectedGroupOff = computed(() => {
    const group = view.value?.groups.find(({ id }) => id === selected.value?.group);
    return group && !group.enabled ? group.title : null;
});
const selectedStage = computed(() =>
    selected.value ? stageTitles.value.get(selected.value.stage) : undefined,
);

/** The local calendar day; near midnight, UTC's is a different one. */
const today = (): string => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const toggle = (capability: string, on: boolean) =>
    edit({ action: "switch", project: id.value, capability, on });

const approve = (stage: string, approving: boolean) =>
    edit({
        action: "gate",
        project: id.value,
        stage,
        approvedOn: approving ? today() : null,
    });
</script>
