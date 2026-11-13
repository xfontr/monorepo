<template>
    <UDashboardPanel id="telemetry">
        <template #header>
            <UDashboardNavbar title="Tooling usage">
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
                <UAlert
                    v-if="!hasRuns"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-info"
                    title="No runs committed yet"
                    description="Scripts record each run into .git, and the next commit carries the rows into data/telemetry/scripts. Commit, then run pnpm exec nx collect @monorepo/developer-portal."
                />

                <template v-if="usage">
                    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatTile
                            label="Runs"
                            :value="totals.runs"
                            :hint="`Last ${usage.windowDays} days`"
                        />
                        <StatTile
                            label="Run by an agent"
                            :value="`${totals.agentShare}%`"
                            :hint="`Last ${usage.windowDays} days`"
                        />
                        <StatTile
                            label="Failed"
                            :value="`${totals.failureRate}%`"
                            :hint="`Alert from ${MIN_RUNS} runs at ${FAILING_RATE * 100}%`"
                            :tone="totals.failing ? 'warn' : 'neutral'"
                        />
                        <StatTile
                            label="Idle scripts"
                            :value="`${totals.idle}/${rows.length}`"
                            :hint="`No run in ${usage.windowDays} days`"
                        />
                    </div>

                    <ScriptActivity :usage />

                    <UsageTriage :usage />

                    <LintUsage :lint="usage.lint" />
                </template>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { FAILING_RATE, MIN_RUNS } from "#layers/telemetry/shared/usage.ts";
import { isFailing, scriptRows, sumDays } from "#layers/telemetry/shared/usageView.ts";

const { data: snapshot } = await useSnapshot("usage");

const usage = computed(() => snapshot.value?.usage ?? null);

const hasRuns = computed(() => Object.keys(usage.value?.scripts ?? {}).length > 0);

const rows = computed(() => (usage.value ? scriptRows(usage.value) : []));

const totals = computed(() => {
    const sum = sumDays(rows.value);

    return {
        runs: sum.runs,
        agentShare: percentOf(sum.agent, sum.runs),
        failureRate: percentOf(sum.failures, sum.runs),
        failing: isFailing(sum),
        idle: rows.value.filter((row) => row.runs === 0).length,
    };
});
</script>
