<script setup lang="ts">
import type { AuditState } from "#shared/audits.ts";
import type { AuditSort } from "#shared/auditReports.ts";
import { countAll, filterAudits, scopesOf, sortAudits } from "#shared/auditReports.ts";
import { AUDIT_STATES } from "#shared/audits.ts";

const { data: snapshot } = await useSnapshot("docs");
const reports = useAuditReports();

const state = ref<AuditState | "all">("all");
const scope = ref<string>("all");
const search = ref("");
const sort = ref<AuditSort>("newest");

const visible = computed(() => sortAudits(
    filterAudits(reports.value, { state: state.value, scope: scope.value, search: search.value }),
    sort.value,
));

const totals = computed(() => countAll(reports.value));

const stateItems = [
    { label: "Every state", value: "all" },
    ...AUDIT_STATES.map((value) => ({ label: auditStateLabel(value), value })),
];

const scopeItems = computed(() => [
    { label: "Every scope", value: "all" },
    ...scopesOf(reports.value).map((value) => ({ label: value, value })),
]);

const sortItems: { label: string, value: AuditSort }[] = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Most open", value: "most-open" },
];
</script>

<template>
    <UDashboardPanel id="audits">
        <template #header>
            <UDashboardNavbar title="Audits">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton
                        to="/docs/docs/audits/readme"
                        label="How an audit is written"
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
                        placeholder="Search title or scope…"
                        size="sm"
                        class="w-56"
                    />
                    <USelect
                        v-model="state"
                        :items="stateItems"
                        value-key="value"
                        size="sm"
                        class="w-40"
                    />
                    <USelect
                        v-model="scope"
                        :items="scopeItems"
                        value-key="value"
                        size="sm"
                        class="w-56"
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
            <div class="flex flex-col gap-4">
                <p class="text-sm text-muted max-w-3xl">
                    Audits record what a static read of one project found wrong at one commit. Each finding keeps its
                    own status, so an audit is worked down over time rather than fixed in one go.
                </p>

                <div
                    v-if="reports.length === 0"
                    class="p-12 text-center"
                >
                    <UIcon
                        name="i-lucide-scan-search"
                        class="size-8 text-dimmed mx-auto mb-2"
                    />
                    <p class="text-sm text-muted">
                        Nothing collected under <code class="font-mono">docs/audits/</code> yet.
                    </p>
                    <p class="text-xs text-dimmed mt-1">
                        The <code class="font-mono">audit-report</code> skill writes them, one dated file per audit;
                        <code class="font-mono">pnpm exec nx collect @monorepo/developer-portal</code> is what reads them in.
                    </p>
                </div>

                <div
                    v-else
                    class="flex flex-col gap-4"
                >
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatTile
                            label="Audits"
                            :value="reports.length"
                            :hint="`${totals.states.closed} closed`"
                            icon="i-lucide-scan-search"
                        />
                        <StatTile
                            :label="findingStatusLabel('open')"
                            :value="totals.findings.open"
                            hint="findings still owed work"
                            :tone="findingStatusTone('open')"
                        />
                        <StatTile
                            :label="findingStatusLabel('fixed')"
                            :value="totals.findings.fixed"
                            hint="the fix has landed"
                            :tone="findingStatusTone('fixed')"
                        />
                        <StatTile
                            :label="findingStatusLabel('wont-fix')"
                            :value="totals.findings['wont-fix']"
                            hint="decided against, deliberately"
                            :tone="findingStatusTone('wont-fix')"
                        />
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <template #header>
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h2 class="font-semibold">
                                        Every audit, and how much of it is left
                                    </h2>
                                    <p class="text-xs text-muted">
                                        Progress counts fixed and won't-fix findings, read from each audit's own Status column.
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
                                :to="`/audits/${report.id}`"
                                class="flex items-center gap-3 px-4 py-2.5 hover:bg-elevated/40 transition-colors"
                            >
                                <span class="text-xs font-mono text-dimmed shrink-0">{{ report.date }}</span>
                                <span class="text-sm truncate flex-1">{{ report.title }}</span>
                                <code
                                    v-if="report.scope"
                                    class="text-xs text-dimmed font-mono shrink-0 hidden md:inline"
                                >{{ report.scope }}</code>

                                <UProgress
                                    :model-value="report.findings.length - report.counts.open"
                                    :max="Math.max(report.findings.length, 1)"
                                    size="sm"
                                    class="w-24 shrink-0"
                                />
                                <span class="text-xs text-muted tabular-nums shrink-0 w-14 text-right">
                                    {{ report.findings.length - report.counts.open }}/{{ report.findings.length }}
                                </span>

                                <StatusPill
                                    :label="auditStateLabel(report.state)"
                                    :tone="auditStateTone(report.state)"
                                />
                            </NuxtLink>
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
