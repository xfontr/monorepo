<script setup lang="ts">
import { deploymentUrlFor } from "#shared/deployments.ts";
import type { ProjectMetrics, ProjectNode } from "#shared/types.ts";

const { data: snapshot } = await useSnapshot();
const { data: live } = useDeployments();
const { public: { repoUrl } } = useRuntimeConfig();

const projects = computed(() => snapshot.value?.projects?.projects ?? []);
const metrics = computed(() => new Map(snapshot.value?.metrics?.projects.map((project) => [project.name, project]) ?? []));
const deployments = computed(() => live.value.deployments);

const areaOrder: Record<string, number> = { apps: 0, infrastructure: 1, packages: 2 };

const orderedProjects = computed(() => projects.value.slice().sort((a, b) => {
    const [aArea] = a.root.split("/");
    const [bArea] = b.root.split("/");
    const aOrder = areaOrder[aArea ?? ""] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = areaOrder[bArea ?? ""] ?? Number.MAX_SAFE_INTEGER;

    return aOrder === bOrder ? a.name.localeCompare(b.name) : aOrder - bOrder;
}));

function metricFor(project: ProjectNode): ProjectMetrics | undefined {
    return metrics.value.get(project.name);
}

function storybookFor(project: ProjectNode): string | undefined {
    return project.name === "@monorepo/ui" ? embedUrl("/storybook/") : undefined;
}

function deploysFor(project: ProjectNode): string | undefined {
    if (project.name === "@monorepo/huella-legal") return `${repoUrl}/actions/workflows/netlify-deployment.yml`;

    if (project.name === "@monorepo/developer-portal") return `${repoUrl}/actions/workflows/docs-deploy.yml`;

    return undefined;
}

function deploymentsFor(project: ProjectNode) {
    return project.name === "@monorepo/huella-legal" ? deployments.value : [];
}

function websiteFor(project: ProjectNode): string | undefined {
    if (project.name === "@monorepo/huella-legal") return deploymentUrlFor(deploymentsFor(project), "netlify-huella-legal");

    if (project.name !== "@monorepo/developer-portal") return undefined;

    try {
        const { hostname, pathname } = new URL(repoUrl);
        const [owner, repo] = pathname.split("/").filter(Boolean);

        return owner && repo && hostname === "github.com" ? `https://${owner}.github.io/${repo}/` : undefined;
    }
    catch {
        return undefined;
    }
}

</script>

<template>
    <UDashboardPanel id="projects">
        <template #header>
            <UDashboardNavbar title="Projects">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge :manifest="snapshot?.manifest ?? null" artifact="metrics" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <UAlert v-if="live.error" color="warning" variant="subtle" icon="i-lucide-cloud-off"
                    title="Live deployment status is unavailable" :description="live.error" />

                <div class="grid gap-4 xl:grid-cols-2">
                    <UCard v-for="project in orderedProjects" :key="project.name" :ui="{ body: 'flex flex-col gap-4' }">
                        <template #header>
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <h2 class="font-semibold truncate">
                                        {{ project.name }}
                                    </h2>
                                    <p class="font-mono text-xs text-dimmed truncate">
                                        {{ project.root }}
                                    </p>
                                </div>
                                <UButton v-if="websiteFor(project)" :to="websiteFor(project)"
                                    icon="i-lucide-external-link" color="neutral" variant="ghost" size="sm" square
                                    target="_blank" :aria-label="`Open ${project.name}`"
                                    :title="`Open ${project.name}`" />
                            </div>
                        </template>

                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p class="text-xs text-dimmed">
                                    Commits
                                </p>
                                <p class="font-semibold">
                                    {{ metricFor(project)?.commits ?? "—" }}
                                </p>
                            </div>
                            <div>
                                <p class="text-xs text-dimmed">
                                    Commits / week (last 90 days)
                                </p>
                                <p class="font-semibold">
                                    {{ metricFor(project)?.commitsPerWeek ?? "—" }}
                                    <span v-if="typeof metricFor(project)?.commitsPerWeek === 'number'"
                                        class="font-normal text-muted"> /
                                        week</span>
                                </p>
                            </div>
                            <div>
                                <p class="text-xs text-dimmed">
                                    Tests
                                </p>
                                <p class="font-semibold">
                                    {{ metricFor(project)?.specs ?? "—" }}
                                </p>
                            </div>
                            <div>
                                <p class="text-xs text-dimmed">
                                    Line coverage
                                </p>
                                <p class="font-semibold">
                                    {{ metricFor(project)?.coverageLinesPct ?? "—" }}
                                    <span v-if="typeof metricFor(project)?.coverageLinesPct === 'number'"
                                        class="font-normal text-muted">%</span>
                                </p>
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <UButton :to="`/docs/${project.root}/readme`" label="Docs" icon="i-lucide-book-open"
                                size="xs" variant="soft" />
                            <UButton v-if="storybookFor(project)" :to="storybookFor(project)" label="Storybook"
                                icon="i-lucide-panels-top-left" size="xs" target="_blank" />
                            <UButton v-if="deploysFor(project)" :to="deploysFor(project)" label="Deploys" size="xs"
                                variant="soft" target="_blank" />
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
