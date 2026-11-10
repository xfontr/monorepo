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
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">By script</h2>
                            <p class="text-xs text-muted">
                                No free text is recorded: no titles, paths or issue numbers.
                            </p>
                        </div>
                    </template>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="text-xs text-muted border-b border-default">
                                <tr>
                                    <th class="text-left font-medium px-4 py-2">Script</th>
                                    <th class="text-right font-medium px-3 py-2">Runs</th>
                                    <th class="text-right font-medium px-3 py-2">
                                        Last {{ windowDays }}d
                                    </th>
                                    <th class="text-right font-medium px-3 py-2">Agent</th>
                                    <th class="text-right font-medium px-3 py-2">Failed</th>
                                    <th class="text-left font-medium px-3 py-2">Projects</th>
                                    <th class="text-left font-medium px-3 py-2">Flags</th>
                                    <th class="text-left font-medium px-4 py-2">Last run</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-default">
                                <tr
                                    v-for="row in rows"
                                    :key="row.name"
                                    class="hover:bg-elevated/40"
                                >
                                    <td class="px-4 py-2 font-mono">{{ row.name }}</td>
                                    <td class="px-3 py-2 text-right tabular-nums">
                                        {{ row.usage.runs }}
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums">
                                        {{ row.usage.recent }}
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums">
                                        {{ agentRuns(row.usage) }}
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums">
                                        {{ row.usage.failures }}
                                    </td>
                                    <td class="px-3 py-2 text-xs text-muted">
                                        {{ top(projectsOf(row.usage)) }}
                                    </td>
                                    <td class="px-3 py-2 text-xs text-muted">
                                        {{ top(row.usage.flags) }}
                                    </td>
                                    <td class="px-4 py-2 text-xs text-muted">
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
import type { ScriptUsage } from "#shared/types.ts";
import { agentRuns, usageAlerts } from "#shared/usage.ts";

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
