<script setup lang="ts">
import type { DecisionOutcome, DecisionStatus } from "#shared/types.ts";
import type { DecisionSort } from "#shared/decisionReports.ts";
import { countByStatus, filterDecisions, sortDecisions } from "#shared/decisionReports.ts";
import { DECISION_OUTCOMES, DECISION_STATUSES } from "#shared/decisions.ts";

const { data: snapshot } = await useSnapshot();
const reports = useDecisionReports();

const status = ref<DecisionStatus | "all">("all");
const decision = ref<DecisionOutcome | "all">("all");
const search = ref("");
const sort = ref<DecisionSort>("newest");

const visible = computed(() => sortDecisions(
    filterDecisions(reports.value, { status: status.value, decision: decision.value, search: search.value }),
    sort.value,
));

const counts = computed(() => countByStatus(reports.value));

const statusItems = [
    { label: "Every status", value: "all" },
    ...DECISION_STATUSES.map((value) => ({ label: decisionStatusLabel(value), value })),
];

const decisionItems = [
    { label: "Every decision", value: "all" },
    ...DECISION_OUTCOMES.map((value) => ({ label: decisionOutcomeLabel(value), value })),
];

const sortItems: { label: string, value: DecisionSort }[] = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Recently updated", value: "updated" },
    { label: "By status", value: "status" },
];
</script>

<template>
    <UDashboardPanel id="decisions">
        <template #header>
            <UDashboardNavbar title="Decisions">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton
                        to="/docs/docs/decisions/readme"
                        label="How a report is written"
                        icon="i-lucide-ruler"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                    />
                    <SnapshotAge
                        :manifest="snapshot?.manifest ?? null"
                        artifact="docs"
                    />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search number or title…"
                        size="sm"
                        class="w-56"
                    />
                    <USelect
                        v-model="status"
                        :items="statusItems"
                        value-key="value"
                        size="sm"
                        class="w-40"
                    />
                    <USelect
                        v-model="decision"
                        :items="decisionItems"
                        value-key="value"
                        size="sm"
                        class="w-40"
                    />
                </template>
                <template #right>
                    <USelect
                        v-model="sort"
                        :items="sortItems"
                        value-key="value"
                        size="sm"
                        class="w-44"
                    />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div
                v-if="reports.length === 0"
                class="p-12 text-center"
            >
                <UIcon
                    name="i-lucide-compass"
                    class="size-8 text-dimmed mx-auto mb-2"
                />
                <p class="text-sm text-muted">
                    Nothing collected under <code class="font-mono">docs/decisions/</code> yet.
                </p>
                <p class="text-xs text-dimmed mt-1">
                    The <code class="font-mono">decision-report</code> skill writes them, one numbered file per decision;
                    <code class="font-mono">pnpm exec nx collect @monorepo/developer-portal</code> is what reads them in.
                </p>
            </div>

            <div
                v-else
                class="flex flex-col gap-4"
            >
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatTile
                        label="Reports"
                        :value="reports.length"
                        hint="one file per decision"
                        icon="i-lucide-compass"
                    />
                    <StatTile
                        :label="decisionStatusLabel('to-implement')"
                        :value="counts['to-implement']"
                        hint="decided, not in the repo yet"
                        :tone="decisionStatusTone('to-implement')"
                    />
                    <StatTile
                        :label="decisionStatusLabel('implemented')"
                        :value="counts.implemented"
                        hint="the work has landed"
                        :tone="decisionStatusTone('implemented')"
                    />
                    <StatTile
                        :label="decisionStatusLabel('wont-implement')"
                        :value="counts['wont-implement']"
                        hint="decided against, deliberately"
                        :tone="decisionStatusTone('wont-implement')"
                    />
                </div>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="font-semibold">
                                    Every decision, as it was recorded
                                </h2>
                                <p class="text-xs text-muted">
                                    The number is consecutive, not the issue's — a listing reads in the order the
                                    decisions were made. Status and decision come from each report's own frontmatter.
                                </p>
                            </div>

                            <span class="text-xs text-dimmed shrink-0 tabular-nums">
                                {{ visible.length }} of {{ reports.length }}
                            </span>
                        </div>
                    </template>

                    <div
                        v-if="visible.length === 0"
                        class="p-12 text-center text-sm text-muted"
                    >
                        Nothing matches that filter.
                    </div>

                    <div
                        v-else
                        class="divide-y divide-default"
                    >
                        <NuxtLink
                            v-for="report in visible"
                            :key="report.path"
                            :to="`/decisions/${report.id}`"
                            class="flex items-center gap-3 px-4 py-2.5 hover:bg-elevated/40 transition-colors"
                        >
                            <span class="text-xs font-mono text-dimmed shrink-0">{{ report.number }}</span>
                            <span class="text-sm truncate flex-1">{{ report.title }}</span>

                            <StatusPill
                                v-if="report.decision === 'superseded'"
                                :label="decisionOutcomeLabel(report.decision)"
                                tone="bad"
                                :hint="`Superseded by ${report.supersededBy}`"
                            />
                            <StatusPill
                                v-if="report.status"
                                :label="decisionStatusLabel(report.status)"
                                :tone="decisionStatusTone(report.status)"
                            />

                            <span class="text-[11px] text-dimmed shrink-0 w-24 text-right">{{ relativeTime(report.updatedAt) }}</span>
                        </NuxtLink>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
