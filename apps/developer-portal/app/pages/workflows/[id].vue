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
                        </p>
                        <p class="flex flex-wrap gap-x-3 text-sm tabular-nums">
                            <span v-for="count in counts" :key="count.label"
                                ><span class="font-semibold">{{ count.value }}</span
                                >&nbsp;<span class="text-muted">{{ count.label }}</span></span
                            >
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

                <NowBoard
                    v-if="open > 0"
                    :now="view.now"
                    :titles
                    @select="(capability) => (selectedId = capability)"
                />
                <p v-else class="text-sm text-muted">
                    No open ticket in the milestone. File a block from the map with
                    <code class="font-mono">pnpm workflow:file {{ id }} &lt;block&gt;</code>.
                </p>

                <div class="rounded-2xl border border-default bg-elevated/30 p-3 sm:p-6">
                    <WorkflowMap
                        :waves="view.waves"
                        :stages="view.stages"
                        :focus="highlight ?? selectedId"
                        :editable
                        :groups="view.groups"
                        :activity="activity?.capabilities"
                        :activity-peak="activity?.peak"
                        @select="(capability) => (selectedId = capability)"
                        @hover="(capability) => (highlight = capability)"
                        @toggle-group="toggle"
                    />
                    <ActivityStrip
                        v-if="activity"
                        :activity
                        :stages="view.stages"
                        class="mt-6 border-t border-default pt-4"
                    />
                </div>
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
                        :titles
                        :editable
                        :activity="activity?.capabilities[selected.id]"
                        :group-off="selectedGroupOff"
                        @toggle="(on) => toggle(selected!.id, on)"
                        @select="(capability) => (selectedId = capability)"
                    />
                </template>
            </USlideover>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { projectActivity } from "#shared/workflowActivity.ts";

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data } = await useWorkflows();
const { editable, edit } = useWorkflowEdit();

const view = computed(() => data.value.projects.find(({ project }) => project.id === id.value));
const activity = computed(() => (view.value ? projectActivity(view.value) : null));

useHead({ title: () => view.value?.project.title ?? "Workflow" });

const synced = computed(() => relativeTime(view.value?.syncedAt));
const problems = computed(() =>
    data.value.problems
        .filter(({ file }) => file.startsWith(`projects/${id.value}.`))
        .map(({ file, message }) => `${file}: ${message}`),
);

const capabilities = computed(() => view.value?.waves.flat() ?? []);
const titles = computed(() =>
    Object.fromEntries(capabilities.value.map((capability) => [capability.id, capability.title])),
);

const counts = computed(() => {
    const now = view.value?.now;

    return [
        { label: "waiting on you", value: now?.waiting.length ?? 0 },
        { label: "ready", value: now?.ready.length ?? 0 },
        { label: "in flight", value: now?.inFlight.length ?? 0 },
        { label: "blocked", value: now?.blocked.length ?? 0 },
    ];
});
const open = computed(() => counts.value.reduce((sum, { value }) => sum + value, 0));

const highlight = ref<string | null>(null);
const selectedId = ref<string | null>(null);
const selected = computed(() =>
    capabilities.value.find((capability) => capability.id === selectedId.value),
);
const selectedGroupOff = computed(() => {
    const group = view.value?.groups.find(({ id }) => id === selected.value?.group);
    return group && !group.enabled ? group.title : null;
});
const selectedStage = computed(
    () => view.value?.stages.find((stage) => stage.id === selected.value?.stage)?.title,
);

const toggle = (capability: string, on: boolean) =>
    edit({ action: "switch", project: id.value, capability, on });
</script>
