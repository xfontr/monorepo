<script setup lang="ts">
import { deploymentUrlFor } from "#shared/deployments.ts";
import type { ProjectMetrics, ProjectNode } from "#shared/types.ts";

const { data: snapshot } = await useSnapshot("projects");
const { data: metricsSnapshot } = await useSnapshot("metrics");
const { data: live } = useDeployments();
const { public: { repoUrl } } = useRuntimeConfig();
const { data: readmes } = await useAsyncData("project-readmes", () =>
    queryCollection("docs").select("path", "title", "description").all());

const projects = computed(() => snapshot.value?.projects?.projects ?? []);
const metrics = computed(() => new Map(metricsSnapshot.value?.metrics?.projects.map((project) => [project.name, project]) ?? []));
const deployments = computed(() => live.value.deployments);
const readmeByPath = computed(() => new Map(
    (readmes.value ?? [])
        .filter((page) => page.path !== "/readme" && page.path.endsWith("/readme"))
        .map((page) => [page.path, page]),
));

const projectLinks: Record<string, { storybook?: string, deploys?: string, environment?: string, website?: () => string | undefined }> = {
    "@monorepo/ui": { storybook: embedUrl("/storybook/") },
    "@monorepo/huella-legal": {
        deploys: `${repoUrl}/actions/workflows/netlify-deployment.yml`,
        environment: "netlify-huella-legal",
    },
    "@monorepo/developer-portal": {
        deploys: `${repoUrl}/actions/workflows/developer-portal-deploy.yml`,
        website: () => {
            try {
                const { hostname, pathname } = new URL(repoUrl);
                const [owner, repo] = pathname.split("/").filter(Boolean);

                return owner && repo && hostname === "github.com" ? `https://${owner}.github.io/${repo}/` : undefined;
            }
            catch {
                return undefined;
            }
        },
    },
};

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

function readmeFor(project: ProjectNode) {
    return readmeByPath.value.get(`/${project.root.toLowerCase()}/readme`);
}

function categoryFor(project: ProjectNode): string {
    const [area] = project.root.split("/");

    return {
        apps: "Application",
        packages: "Shared building block",
        infrastructure: "Repository tooling",
    }[area ?? ""] ?? "Repository project";
}

function storybookFor(project: ProjectNode): string | undefined {
    return projectLinks[project.name]?.storybook;
}

function deploysFor(project: ProjectNode): string | undefined {
    return projectLinks[project.name]?.deploys;
}

function deploymentsFor(project: ProjectNode) {
    return projectLinks[project.name]?.environment ? deployments.value : [];
}

function websiteFor(project: ProjectNode): string | undefined {
    const links = projectLinks[project.name];
    if (links?.environment) return deploymentUrlFor(deploymentsFor(project), links.environment);

    return links?.website?.();
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
                    <SnapshotAge
                        :manifest="snapshot?.manifest ?? null"
                        artifact="metrics"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <UAlert
                    v-if="live.error"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-cloud-off"
                    title="Live deployment status is unavailable"
                    :description="live.error"
                />

                <div class="grid gap-4 xl:grid-cols-2">
                    <UCard
                        v-for="project in orderedProjects"
                        :key="project.name"
                        :ui="{ body: 'flex flex-col gap-4' }"
                    >
                        <template #header>
                            <h2 class="font-semibold">
                                {{ readmeFor(project)?.title ?? project.name }}
                            </h2>
                        </template>

                        <div class="flex flex-col gap-3">
                            <p class="text-sm text-muted">
                                {{ readmeFor(project)?.description ?? "No project description is available yet." }}
                            </p>

                            <div class="flex items-center gap-2">
                                <span class="text-xs text-dimmed">Category</span>
                                <UBadge
                                    :label="categoryFor(project)"
                                    color="primary"
                                    variant="subtle"
                                    size="sm"
                                />
                            </div>

                            <div class="flex flex-col gap-1 text-sm">
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

                            <div class="flex flex-wrap gap-2">
                                <UButton
                                    v-if="websiteFor(project)"
                                    :to="websiteFor(project)"
                                    label="Open site"
                                    icon="i-lucide-external-link"
                                    size="xs"
                                    target="_blank"
                                />
                                <UButton
                                    :to="`/docs/${project.root.toLowerCase()}/readme`"
                                    label="Docs"
                                    icon="i-lucide-book-open"
                                    size="xs"
                                    variant="soft"
                                />
                                <UButton
                                    v-if="storybookFor(project)"
                                    :to="storybookFor(project)"
                                    label="Storybook"
                                    icon="i-lucide-panels-top-left"
                                    size="xs"
                                    target="_blank"
                                />
                                <UButton
                                    v-if="deploysFor(project)"
                                    :to="deploysFor(project)"
                                    label="Deploys"
                                    size="xs"
                                    variant="soft"
                                    target="_blank"
                                />
                            </div>
                        </div>

                        <div class="border-t border-default pt-3 flex flex-col gap-3 text-sm text-muted">
                            <div>
                                <p class="text-xs text-dimmed">
Technical details
</p>
                                <p class="font-mono text-xs truncate">
{{ project.name }} · {{ project.root }}
</p>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
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
                                    <span
                                        v-if="typeof metricFor(project)?.commitsPerWeek === 'number'"
                                        class="font-normal text-muted"
                                    > /
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
                                    <span
                                        v-if="typeof metricFor(project)?.coverageLinesPct === 'number'"
                                        class="font-normal text-muted"
                                    >%</span>
                                </p>
                            </div>
                            </div>
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
