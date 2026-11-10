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
                    <SnapshotAge :manifest="snapshot?.manifest ?? null" artifact="docs" />
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
                <p class="max-w-3xl text-sm text-muted">
                    Audits record what a static read of one project found wrong at one commit. Each
                    finding keeps its own status, so an audit is worked down over time rather than
                    fixed in one go.
                </p>

                <div v-if="reports.length === 0" class="p-12 text-center">
                    <UIcon name="i-lucide-scan-search" class="mx-auto mb-2 size-8 text-dimmed" />
                    <p class="text-sm text-muted">
                        Nothing collected under <code class="font-mono">docs/audits/</code> yet.
                    </p>
                    <p class="mt-1 text-xs text-dimmed">
                        The <code class="font-mono">audit-report</code> skill writes them, one dated
                        file per audit;
                        <code class="font-mono"
                            >pnpm exec nx collect @monorepo/developer-portal</code
                        >
                        is what reads them in.
                    </p>
                </div>

                <div v-else class="flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatTile
                            label="Audits"
                            :value="reports.length"
                            :hint="`${totals.states.closed} closed`"
                            icon="i-lucide-scan-search"
                        />
                        <StatTile
                            v-for="{ status, hint } in findingTiles"
                            :key="status"
                            :label="findingStatusLabel(status)"
                            :value="totals.findings[status]"
                            :hint
                            :tone="findingStatusTone(status)"
                        />
                    </div>

                    <UCard variant="flush">
                        <template #header>
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h2 class="font-semibold">
                                        Every audit, and how much of it is left
                                    </h2>
                                    <p class="text-xs text-muted">
                                        Progress counts fixed and won't-fix findings, read from each
                                        audit's own Status column.
                                    </p>
                                </div>

                                <span class="shrink-0 text-xs text-dimmed tabular-nums">
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

                        <div v-else class="divide-y divide-default">
                            <NuxtLink
                                v-for="report in visible"
                                :key="report.path"
                                :to="`/audits/${report.id}`"
                                class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-elevated/50"
                            >
                                <span class="shrink-0 font-mono text-xs text-dimmed">{{
                                    report.date
                                }}</span>
                                <span class="flex-1 truncate text-sm">{{ report.title }}</span>
                                <code
                                    v-if="report.scope"
                                    class="hidden shrink-0 font-mono text-xs text-dimmed md:inline"
                                    >{{ report.scope }}</code
                                >

                                <UProgress
                                    :model-value="report.findings.length - report.counts.open"
                                    :max="Math.max(report.findings.length, 1)"
                                    size="sm"
                                    class="w-24 shrink-0"
                                />
                                <span
                                    class="w-14 shrink-0 text-right text-xs text-muted tabular-nums"
                                >
                                    {{ report.findings.length - report.counts.open }}/{{
                                        report.findings.length
                                    }}
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

<script setup lang="ts">
import type { AuditState, FindingStatus } from "#layers/snapshot/shared/audits.ts";
import type { AuditSort } from "#layers/audits/shared/auditReports.ts";
import {
    countAll,
    filterAudits,
    scopesOf,
    sortAudits,
} from "#layers/audits/shared/auditReports.ts";
import { AUDIT_STATES } from "#layers/snapshot/shared/audits.ts";

const { data: snapshot } = await useSnapshot("docs");
const reports = useAuditReports();

const state = ref<AuditState | "all">("all");
const scope = ref<string>("all");
const search = ref("");
const sort = ref<AuditSort>("newest");

const visible = computed(() =>
    sortAudits(
        filterAudits(reports.value, {
            state: state.value,
            scope: scope.value,
            search: search.value,
        }),
        sort.value,
    ),
);

const totals = computed(() => countAll(reports.value));

const findingTiles: { status: FindingStatus; hint: string }[] = [
    { status: "open", hint: "findings still owed work" },
    { status: "fixed", hint: "the fix has landed" },
    { status: "wont-fix", hint: "decided against, deliberately" },
];

const stateItems = [
    { label: "Every state", value: "all" },
    ...AUDIT_STATES.map((value) => ({ label: auditStateLabel(value), value })),
];

const scopeItems = computed(() => [
    { label: "Every scope", value: "all" },
    ...scopesOf(reports.value).map((value) => ({ label: value, value })),
]);

const sortItems: { label: string; value: AuditSort }[] = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Most open", value: "most-open" },
];
</script>
