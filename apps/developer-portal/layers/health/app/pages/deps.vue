<template>
    <UDashboardPanel id="deps">
        <template #header>
            <UDashboardNavbar title="Dependencies">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge :manifest="snapshot?.manifest ?? null" artifact="deps" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <div
                    v-if="deps?.vulnerabilities || deps?.outdated"
                    class="grid grid-cols-2 gap-3 lg:grid-cols-5"
                >
                    <StatTile
                        v-for="severity in severities"
                        :key="severity"
                        :label="severity"
                        :value="deps?.vulnerabilities ? deps.vulnerabilities[severity] : '—'"
                        hint="pnpm audit"
                        :tone="
                            deps?.vulnerabilities && deps.vulnerabilities[severity] > 0
                                ? severityTone(severity)
                                : 'neutral'
                        "
                    />
                    <StatTile
                        label="outdated"
                        :value="deps?.outdated ? deps.outdated.length : '—'"
                        hint="pnpm outdated -r"
                        :tone="(deps?.outdated?.length ?? 0) > 0 ? 'warn' : 'neutral'"
                    />
                </div>

                <UCard variant="flush">
                    <template #header>
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="font-semibold">Advisories</h2>
                                <p class="text-xs text-muted">
                                    Every finding
                                    <code class="font-mono">pnpm audit --json</code> reports, over
                                    the whole workspace lockfile.
                                </p>
                            </div>

                            <span v-if="deps?.totalDependencies" class="shrink-0 text-xs text-muted"
                                >{{ deps.totalDependencies }} dependencies audited</span
                            >
                        </div>
                    </template>

                    <div v-if="advisories.length === 0" class="p-8 text-center text-sm text-muted">
                        {{ deps?.vulnerabilities ? "No known vulnerabilities." : "Not collected." }}
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Module</th>
                                    <th>Severity</th>
                                    <th>Title</th>
                                    <th>Patched</th>
                                    <th>Pulled in via</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="advisory in advisories" :key="advisory.id">
                                    <td class="font-mono text-xs">
                                        {{ advisory.moduleName }}
                                    </td>
                                    <td :class="toneClass(severityTone(advisory.severity))">
                                        {{ advisory.severity }}
                                    </td>
                                    <td>
                                        <a
                                            :href="advisory.url"
                                            target="_blank"
                                            rel="noopener"
                                            class="hover:underline"
                                            >{{ advisory.title }}</a
                                        >
                                    </td>
                                    <td class="font-mono text-xs text-muted">
                                        {{ advisory.patchedVersions }}
                                    </td>
                                    <td class="max-w-64 truncate font-mono text-xs text-muted">
                                        {{ advisory.paths.join(", ") }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UCard>

                <UCard variant="flush">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">Outdated</h2>
                            <p class="text-xs text-muted">
                                <code class="font-mono">pnpm outdated -r</code> across every project
                                — wanted is what the current range in package.json already allows.
                            </p>
                        </div>
                    </template>

                    <div v-if="outdated.length === 0" class="p-8 text-center text-sm text-muted">
                        {{
                            deps?.outdated
                                ? "Everything is on its wanted version."
                                : "Not collected."
                        }}
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Package</th>
                                    <th class="numeric">Current</th>
                                    <th class="numeric">Wanted</th>
                                    <th class="numeric">Latest</th>
                                    <th>Used by</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="pkg in outdated" :key="pkg.name">
                                    <td class="font-mono text-xs">
                                        {{ pkg.name }}
                                        <span v-if="pkg.isDeprecated" class="tone-bad"
                                            >· deprecated</span
                                        >
                                    </td>
                                    <td class="numeric text-muted">
                                        {{ pkg.current }}
                                    </td>
                                    <td class="numeric text-muted">
                                        {{ pkg.wanted }}
                                    </td>
                                    <td class="numeric">
                                        {{ pkg.latest }}
                                    </td>
                                    <td class="max-w-64 truncate font-mono text-xs text-muted">
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

<script setup lang="ts">
const { data: snapshot } = await useSnapshot("deps");

const deps = computed(() => snapshot.value?.deps ?? null);
const advisories = computed(() => deps.value?.advisories ?? []);
const outdated = computed(() => deps.value?.outdated ?? []);

const severities = ["critical", "high", "moderate", "low"] as const;
</script>
