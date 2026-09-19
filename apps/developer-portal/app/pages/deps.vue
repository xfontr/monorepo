<script setup lang="ts">
const { data: snapshot } = await useSnapshot();

const deps = computed(() => snapshot.value?.deps ?? null);
const advisories = computed(() => deps.value?.advisories ?? []);
const outdated = computed(() => deps.value?.outdated ?? []);

const severities = ["critical", "high", "moderate", "low"] as const;
</script>

<template>
    <UDashboardPanel id="deps">
        <template #header>
            <UDashboardNavbar title="Dependencies">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge
                        :manifest="snapshot?.manifest ?? null"
                        artifact="deps"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <div
                    v-if="deps?.vulnerabilities || deps?.outdated"
                    class="grid grid-cols-2 lg:grid-cols-5 gap-3"
                >
                    <StatTile
                        v-for="severity in severities"
                        :key="severity"
                        :label="severity"
                        :value="deps?.vulnerabilities ? deps.vulnerabilities[severity] : '—'"
                        hint="pnpm audit"
                        :tone="deps?.vulnerabilities && deps.vulnerabilities[severity] > 0 ? severityTone(severity) : 'neutral'"
                    />
                    <StatTile
                        label="outdated"
                        :value="deps?.outdated ? deps.outdated.length : '—'"
                        hint="pnpm outdated -r"
                        :tone="(deps?.outdated?.length ?? 0) > 0 ? 'warn' : 'neutral'"
                    />
                </div>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="font-semibold">
                                    Advisories
                                </h2>
                                <p class="text-xs text-muted">
                                    Every finding <code class="font-mono">pnpm audit --json</code> reports, over the
                                    whole workspace lockfile.
                                </p>
                            </div>

                            <span
                                v-if="deps?.totalDependencies"
                                class="text-xs text-muted shrink-0"
                            >{{ deps.totalDependencies }} dependencies audited</span>
                        </div>
                    </template>

                    <div
                        v-if="advisories.length === 0"
                        class="p-8 text-center text-sm text-muted"
                    >
                        {{ deps?.vulnerabilities ? "No known vulnerabilities." : "Not collected." }}
                    </div>

                    <div
                        v-else
                        class="overflow-x-auto"
                    >
                        <table class="w-full text-sm">
                            <thead class="text-xs text-muted border-b border-default">
                                <tr>
                                    <th class="text-left font-medium px-4 py-2">
                                        Module
                                    </th>
                                    <th class="text-left font-medium px-3 py-2">
                                        Severity
                                    </th>
                                    <th class="text-left font-medium px-3 py-2">
                                        Title
                                    </th>
                                    <th class="text-left font-medium px-3 py-2">
                                        Patched
                                    </th>
                                    <th class="text-left font-medium px-4 py-2">
                                        Pulled in via
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-default">
                                <tr
                                    v-for="advisory in advisories"
                                    :key="advisory.id"
                                    class="hover:bg-elevated/40"
                                >
                                    <td class="px-4 py-2 font-mono text-xs">
                                        {{ advisory.moduleName }}
                                    </td>
                                    <td
                                        class="px-3 py-2"
                                        :class="`tone-${severityTone(advisory.severity)}`"
                                    >
                                        {{ advisory.severity }}
                                    </td>
                                    <td class="px-3 py-2">
                                        <a
                                            :href="advisory.url"
                                            target="_blank"
                                            rel="noopener"
                                            class="hover:underline"
                                        >{{ advisory.title }}</a>
                                    </td>
                                    <td class="px-3 py-2 font-mono text-xs text-muted">
                                        {{ advisory.patchedVersions }}
                                    </td>
                                    <td class="px-4 py-2 font-mono text-xs text-muted truncate max-w-64">
                                        {{ advisory.paths.join(", ") }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UCard>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                Outdated
                            </h2>
                            <p class="text-xs text-muted">
                                <code class="font-mono">pnpm outdated -r</code> across every project — wanted is
                                what the current range in package.json already allows.
                            </p>
                        </div>
                    </template>

                    <div
                        v-if="outdated.length === 0"
                        class="p-8 text-center text-sm text-muted"
                    >
                        {{ deps?.outdated ? "Everything is on its wanted version." : "Not collected." }}
                    </div>

                    <div
                        v-else
                        class="overflow-x-auto"
                    >
                        <table class="w-full text-sm">
                            <thead class="text-xs text-muted border-b border-default">
                                <tr>
                                    <th class="text-left font-medium px-4 py-2">
                                        Package
                                    </th>
                                    <th class="text-right font-medium px-3 py-2">
                                        Current
                                    </th>
                                    <th class="text-right font-medium px-3 py-2">
                                        Wanted
                                    </th>
                                    <th class="text-right font-medium px-3 py-2">
                                        Latest
                                    </th>
                                    <th class="text-left font-medium px-4 py-2">
                                        Used by
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-default">
                                <tr
                                    v-for="pkg in outdated"
                                    :key="pkg.name"
                                    class="hover:bg-elevated/40"
                                >
                                    <td class="px-4 py-2 font-mono text-xs">
                                        {{ pkg.name }}
                                        <span
                                            v-if="pkg.isDeprecated"
                                            class="tone-bad"
                                        >· deprecated</span>
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums text-muted">
                                        {{ pkg.current }}
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums text-muted">
                                        {{ pkg.wanted }}
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums">
                                        {{ pkg.latest }}
                                    </td>
                                    <td class="px-4 py-2 font-mono text-xs text-muted truncate max-w-64">
                                        {{ pkg.dependents.join(", ") }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
