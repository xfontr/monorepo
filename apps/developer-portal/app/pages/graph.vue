<script setup lang="ts">
const { data: snapshot } = await useSnapshot("projects");
const { data: metricsSnapshot } = await useSnapshot("metrics");

const projects = computed(() => snapshot.value?.projects?.projects ?? []);
const findings = computed(() => metricsSnapshot.value?.metrics?.invariantFindings ?? []);
const projectGroups = computed(() => [
    {
        label: "Applications",
        projects: projects.value.filter((project) => project.root.startsWith("apps/")),
    },
    {
        label: "Shared building blocks",
        projects: projects.value.filter((project) => project.root.startsWith("packages/")),
    },
    {
        label: "Repository tooling",
        projects: projects.value.filter((project) => !project.root.startsWith("apps/") && !project.root.startsWith("packages/")),
    },
]);

const graphEmbed = embedUrl("/embed/graph/index.html");
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

                <section class="flex flex-col gap-3">
                    <div>
                        <h2 class="text-xl font-semibold">
How the pieces fit
</h2>
                        <p class="text-sm text-muted mt-1">
                            The repository groups applications, shared building blocks, and the tooling that supports them.
                        </p>
                    </div>

                    <div class="grid gap-4 xl:grid-cols-3">
                        <UCard
                            v-for="group in projectGroups"
                            :key="group.label"
                        >
                            <template #header>
                                <h3 class="font-semibold">
{{ group.label }}
</h3>
                            </template>

                            <div
                                v-if="group.projects.length === 0"
                                class="text-sm text-muted"
                            >
                                No projects in this group.
                            </div>

                            <div
                                v-else
                                class="flex flex-col gap-4"
                            >
                                <div
                                    v-for="project in group.projects"
                                    :key="project.name"
                                    class="flex flex-col gap-2"
                                >
                                    <div>
                                        <p class="text-sm font-medium">
{{ project.name }}
</p>
                                        <p class="text-xs text-dimmed font-mono">
{{ project.root }}
</p>
                                    </div>

                                    <div
                                        v-if="project.tags.length > 0"
                                        class="flex flex-wrap gap-1.5"
                                    >
                                        <UBadge
                                            v-for="tag in project.tags"
                                            :key="tag"
                                            :label="tag"
                                            color="neutral"
                                            variant="subtle"
                                            size="sm"
                                            class="font-mono text-[11px]"
                                        />
                                    </div>

                                    <div class="flex flex-col gap-0.5 text-xs text-muted">
                                        <div v-if="project.dependsOn.length > 0">
                                            <span class="text-dimmed">Uses:</span> {{ project.dependsOn.join(", ") }}
                                        </div>
                                        <div v-if="project.dependedOnBy.length > 0">
                                            <span class="text-dimmed">Used by:</span> {{ project.dependedOnBy.join(", ") }}
                                        </div>
                                        <p
                                            v-if="project.dependsOn.length === 0 && project.dependedOnBy.length === 0"
                                            class="text-dimmed"
                                        >
                                            No project relationships recorded.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </UCard>
                    </div>
                </section>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
Detailed Nx graph
</h2>
                            <p class="text-xs text-muted">
                                Nx's own graph client, vendored in by the collector rather than redrawn.
                            </p>
                        </div>
                    </template>

                    <iframe
                        :src="graphEmbed"
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
