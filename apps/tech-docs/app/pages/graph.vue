<script setup lang="ts">
const { data: snapshot } = await useSnapshot();

const projects = computed(() => snapshot.value?.projects?.projects ?? []);
const findings = computed(() => snapshot.value?.metrics?.invariantFindings ?? []);
</script>

<template>
    <UDashboardPanel id="graph">
        <template #header>
            <UDashboardNavbar title="Project graph">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge
                        :manifest="snapshot?.manifest ?? null"
                        artifact="projects"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <UAlert
                    v-for="finding in findings"
                    :key="finding.id"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-unlink"
                    :title="finding.title"
                    :description="finding.detail"
                />

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                Dependencies
                            </h2>
                            <p class="text-xs text-muted">
                                Nx's own graph client, vendored in by the collector rather than redrawn.
                            </p>
                        </div>
                    </template>

                    <iframe
                        src="/embed/graph/index.html"
                        class="embedded-report border-0 rounded-none"
                        :style="{ height: '520px' }"
                        title="Nx project graph"
                    />
                </UCard>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                Tags and edges
                            </h2>
                            <p class="text-xs text-muted">
                                What the picture does not answer: which tags a project carries, and what breaks if it changes.
                            </p>
                        </div>
                    </template>

                    <div class="divide-y divide-default">
                        <div
                            v-for="project in projects"
                            :key="project.name"
                            class="px-4 py-3 flex items-start gap-4"
                        >
                            <div class="w-56 shrink-0">
                                <div class="text-sm font-medium">
                                    {{ project.name }}
                                </div>
                                <div class="text-xs text-dimmed font-mono">
                                    {{ project.root }}
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-1.5 w-56 shrink-0">
                                <UBadge
                                    v-for="tag in project.tags"
                                    :key="tag"
                                    :color="tag.startsWith('type:') ? 'primary' : 'neutral'"
                                    variant="subtle"
                                    size="sm"
                                    class="font-mono text-[11px]"
                                    :label="tag"
                                />
                            </div>

                            <div class="flex-1 min-w-0 text-xs text-muted flex flex-col gap-0.5">
                                <div
                                    v-if="project.dependsOn.length > 0"
                                    class="truncate"
                                >
                                    <span class="text-dimmed">uses </span>{{ project.dependsOn.join(", ") }}
                                </div>
                                <div
                                    v-if="project.dependedOnBy.length > 0"
                                    class="truncate"
                                >
                                    <span class="text-dimmed">used by </span>{{ project.dependedOnBy.join(", ") }}
                                </div>
                                <div
                                    v-if="project.dependsOn.length === 0 && project.dependedOnBy.length === 0"
                                    class="text-dimmed"
                                >
                                    leaf
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
