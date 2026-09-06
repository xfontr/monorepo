<script setup lang="ts">
const { data: snapshot } = await useSnapshot();

const coverage = computed(() => snapshot.value?.coverage ?? null);
const projects = computed(() => coverage.value?.projects ?? []);

const metrics = ["lines", "statements", "functions", "branches"] as const;
</script>

<template>
    <UDashboardPanel id="coverage">
        <template #header>
            <UDashboardNavbar title="Coverage">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge
                        :manifest="snapshot?.manifest ?? null"
                        artifact="coverage"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <div
                    v-if="coverage?.totals"
                    class="grid grid-cols-2 lg:grid-cols-4 gap-3"
                >
                    <StatTile
                        v-for="metric in metrics"
                        :key="metric"
                        :label="metric"
                        :value="`${coverage.totals[metric]}%`"
                        hint="weighted across collected projects"
                        :tone="coverageTone(coverage.totals[metric])"
                    />
                </div>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                By project
                            </h2>
                            <p class="text-xs text-muted">
                                The workspace figure is weighted by size, not averaged across projects — an average
                                lets one large well-tested package hide a small untested one.
                            </p>
                        </div>
                    </template>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="text-xs text-muted border-b border-default">
                                <tr>
                                    <th class="text-left font-medium px-4 py-2">
                                        Project
                                    </th>
                                    <th
                                        v-for="metric in metrics"
                                        :key="metric"
                                        class="text-right font-medium px-3 py-2"
                                    >
                                        {{ metric }}
                                    </th>
                                    <th class="text-right font-medium px-4 py-2">
                                        Files
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-default">
                                <tr
                                    v-for="project in projects"
                                    :key="project.name"
                                    class="hover:bg-elevated/40"
                                >
                                    <td class="px-4 py-2">
                                        {{ project.name }}
                                    </td>

                                    <template v-if="project.collected">
                                        <td
                                            v-for="metric in metrics"
                                            :key="metric"
                                            class="px-3 py-2 text-right tabular-nums"
                                            :class="`tone-${coverageTone(project[metric]?.pct)}`"
                                        >
                                            {{ project[metric]?.pct ?? "—" }}%
                                        </td>
                                    </template>

                                    <!-- Absent is its own state. Not 0%, and certainly not 100%. -->
                                    <td
                                        v-else
                                        colspan="4"
                                        class="px-3 py-2 text-right text-xs text-dimmed italic"
                                    >
                                        not collected
                                    </td>

                                    <td class="px-4 py-2 text-right tabular-nums text-muted">
                                        {{ project.collected ? project.files : "—" }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UCard>

                <UCard
                    v-if="coverage?.report"
                    :ui="{ body: 'p-0 sm:p-0' }"
                >
                    <template #header>
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="font-semibold">
                                    Line-by-line report
                                </h2>
                                <p class="text-xs text-muted">
                                    The merged report <code class="font-mono">pnpm test:coverage</code> already
                                    renders, copied in by the collector — not redrawn.
                                </p>
                            </div>

                            <UButton
                                to="/embed/coverage/index.html"
                                target="_blank"
                                external
                                label="Open full"
                                icon="i-lucide-external-link"
                                color="neutral"
                                variant="subtle"
                                size="xs"
                            />
                        </div>
                    </template>

                    <iframe
                        src="/embed/coverage/index.html"
                        class="embedded-report border-0 rounded-none"
                        :style="{ height: '640px' }"
                        title="Coverage report"
                    />
                </UCard>

                <UAlert
                    v-else
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-info"
                    title="No HTML report copied in"
                    description="Run pnpm test:coverage from the workspace root, then pnpm tech-docs:collect."
                />
            </div>
        </template>
    </UDashboardPanel>
</template>
