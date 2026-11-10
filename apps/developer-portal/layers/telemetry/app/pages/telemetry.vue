<template>
    <UDashboardPanel id="telemetry">
        <template #header>
            <UDashboardNavbar title="Telemetry">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge :manifest="snapshot?.manifest ?? null" artifact="usage" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile
                        label="Runs"
                        :value="totals.runs"
                        :hint="`${totals.recent} in the last ${windowDays} days`"
                    />
                    <StatTile label="Scripts used" :value="`${rows.length}/${known.length}`" />
                    <StatTile label="Run by an agent" :value="`${totals.agentShare}%`" />
                    <StatTile
                        label="Failed"
                        :value="`${totals.failureRate}%`"
                        :tone="totals.failureRate >= 25 ? 'warn' : 'neutral'"
                    />
                </div>

                <UCard v-if="alerts.length > 0">
                    <template #header>
                        <h2 class="font-semibold">Worth a look</h2>
                    </template>

                    <ul class="flex flex-col gap-2 text-sm">
                        <li v-for="alert in alerts" :key="`${alert.script}-${alert.kind}`">
                            <code class="font-mono">{{ alert.script }}</code>
                            <span class="text-muted"> — {{ alert.message }}</span>
                        </li>
                    </ul>
                </UCard>

                <UCard variant="flush">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">By script</h2>
                            <p class="text-xs text-muted">
                                No free text is recorded: no titles, paths or issue numbers.
                            </p>
                        </div>
                    </template>

                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Script</th>
                                    <th class="numeric">Runs</th>
                                    <th class="numeric">Last {{ windowDays }}d</th>
                                    <th class="numeric">Agent</th>
                                    <th class="numeric">Failed</th>
                                    <th>Projects</th>
                                    <th>Flags</th>
                                    <th>Last run</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in rows" :key="row.name">
                                    <td class="font-mono">{{ row.name }}</td>
                                    <td class="numeric">
                                        {{ row.usage.runs }}
                                    </td>
                                    <td class="numeric">
                                        {{ row.usage.recent }}
                                    </td>
                                    <td class="numeric">
                                        {{ agentRuns(row.usage) }}
                                    </td>
                                    <td class="numeric">
                                        {{ row.usage.failures }}
                                    </td>
                                    <td class="text-xs text-muted">
                                        {{ top(projectsOf(row.usage)) }}
                                    </td>
                                    <td class="text-xs text-muted">
                                        {{ top(row.usage.flags) }}
                                    </td>
                                    <td class="text-xs text-muted">
                                        {{ row.usage.last.slice(0, 10) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UCard>

                <UAlert
                    v-if="rows.length === 0"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-info"
                    title="No runs committed yet"
                    description="Scripts record each run into .git, and the next commit carries the rows into .telemetry/scripts. Commit, then run pnpm exec nx collect @monorepo/developer-portal."
                />

                <LintUsage v-if="usage" :lint="usage.lint" :window-days />
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { ScriptUsage } from "#layers/snapshot/shared/types.ts";
import { agentRuns, usageAlerts } from "#layers/telemetry/shared/usage.ts";

const { data: snapshot } = await useSnapshot("usage");

const usage = computed(() => snapshot.value?.usage ?? null);
const known = computed(() => usage.value?.known ?? []);
const windowDays = computed(() => usage.value?.windowDays ?? 90);
const scripts = computed(() => usage.value?.scripts ?? {});

const rows = computed(() =>
    Object.entries(scripts.value)
        .map(([name, usage]) => ({ name, usage }))
        .sort((a, b) => b.usage.runs - a.usage.runs),
);

const alerts = computed(() => (usage.value ? usageAlerts(usage.value) : []));

const share = (part: number, whole: number): number =>
    whole === 0 ? 0 : Math.round((part / whole) * 100);

const totals = computed(() => {
    const runs = rows.value.reduce((sum, row) => sum + row.usage.runs, 0);
    const recent = rows.value.reduce((sum, row) => sum + row.usage.recent, 0);
    const agent = rows.value.reduce((sum, row) => sum + agentRuns(row.usage), 0);
    const failed = rows.value.reduce((sum, row) => sum + row.usage.failures, 0);

    return { runs, recent, agentShare: share(agent, runs), failureRate: share(failed, runs) };
});

/** A project named on the command line says more than the branch the run happened on. */
const projectsOf = (usage: ScriptUsage): Record<string, number> =>
    Object.keys(usage.targets).length > 0 ? usage.targets : usage.areas;

const top = (counts: Record<string, number>): string =>
    Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => `${name} ${count}`)
        .join(", ") || "—";
</script>
