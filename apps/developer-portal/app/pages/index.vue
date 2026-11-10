<template>
    <UDashboardPanel id="overview">
        <template #header>
            <UDashboardNavbar title="Overview">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge :manifest="docsSnapshot?.manifest ?? null" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-6">
                <section class="flex flex-col gap-3">
                    <div class="max-w-3xl">
                        <h1 class="text-2xl font-semibold">
                            {{ repositoryReadme?.title ?? "Monorepo" }}
                        </h1>
                        <p class="mt-1 text-sm text-muted">
                            {{
                                repositoryReadme?.description ??
                                "The repository summary is not available yet."
                            }}
                        </p>
                    </div>

                    <div class="grid gap-3 md:grid-cols-3">
                        <NuxtLink
                            to="/projects"
                            class="rounded-lg border border-default bg-default p-4 transition-colors hover:bg-elevated/50"
                        >
                            <UIcon name="i-lucide-boxes" class="size-5 text-primary" />
                            <h2 class="mt-3 font-semibold">Explore what exists</h2>
                            <p class="mt-1 text-sm text-muted">
                                Browse the applications, building blocks, and tooling.
                            </p>
                        </NuxtLink>
                        <NuxtLink
                            to="/graph"
                            class="rounded-lg border border-default bg-default p-4 transition-colors hover:bg-elevated/50"
                        >
                            <UIcon name="i-lucide-git-fork" class="size-5 text-primary" />
                            <h2 class="mt-3 font-semibold">Understand how it works</h2>
                            <p class="mt-1 text-sm text-muted">
                                See how projects fit together and share responsibilities.
                            </p>
                        </NuxtLink>
                        <NuxtLink
                            to="/docs/docs/guides/first-hour"
                            class="rounded-lg border border-default bg-default p-4 transition-colors hover:bg-elevated/50"
                        >
                            <UIcon name="i-lucide-play" class="size-5 text-primary" />
                            <h2 class="mt-3 font-semibold">Run or contribute</h2>
                            <p class="mt-1 text-sm text-muted">
                                Get a working checkout and find your first useful step.
                            </p>
                        </NuxtLink>
                    </div>
                </section>

                <section class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <h2 class="text-xl font-semibold">Featured projects</h2>
                            <p class="mt-1 text-sm text-muted">
                                Applications that show what this repository produces.
                            </p>
                        </div>
                        <UButton
                            to="/projects"
                            label="All projects"
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            trailing-icon="i-lucide-arrow-right"
                        />
                    </div>

                    <div class="grid gap-4 xl:grid-cols-2">
                        <UCard
                            v-for="project in featuredProjects"
                            :key="project.name"
                            :ui="{
                                root: 'h-full flex flex-col',
                                header: 'flex-1',
                                body: 'mt-auto',
                            }"
                        >
                            <template #header>
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <h3 class="font-semibold">
                                            {{ readmeFor(project)?.title ?? project.name }}
                                        </h3>
                                        <p class="mt-1 line-clamp-3 text-sm text-muted">
                                            {{
                                                readmeFor(project)?.description ??
                                                "No project description is available yet."
                                            }}
                                        </p>
                                    </div>
                                    <UBadge label="Application" color="primary" variant="subtle" />
                                </div>
                            </template>
                            <div class="flex items-center justify-between gap-3">
                                <span class="truncate font-mono text-xs text-dimmed">{{
                                    project.root
                                }}</span>
                                <UButton
                                    :to="`/docs/${project.root}/readme`"
                                    label="Read more"
                                    icon="i-lucide-book-open"
                                    size="xs"
                                    variant="soft"
                                />
                            </div>
                        </UCard>
                    </div>
                </section>

                <section class="flex flex-col gap-4">
                    <div>
                        <h2 class="text-xl font-semibold">Engineering health</h2>
                        <p class="mt-1 text-sm text-muted">
                            Collected repository signals and live work in progress.
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <StatTile
                            label="Docs"
                            :value="docs?.pages.length ?? '—'"
                            :hint="
                                docs
                                    ? docs.brokenLinkCount === 0
                                        ? 'no broken links'
                                        : `${docs.brokenLinkCount} broken link${docs.brokenLinkCount === 1 ? '' : 's'}`
                                    : 'not collected'
                            "
                            :tone="(docs?.brokenLinkCount ?? 0) > 0 ? 'warn' : 'neutral'"
                            icon="i-lucide-book-open"
                            to="/docs"
                        />
                        <StatTile
                            label="Line coverage"
                            :value="coverage === null ? '—' : `${coverage}%`"
                            hint="weighted, collected projects only"
                            :tone="coverageTileTone"
                            icon="i-lucide-shield-check"
                            to="/coverage"
                        />
                        <StatTile
                            label="Projects"
                            :value="projects"
                            :hint="`${findings.length} invariant finding${findings.length === 1 ? '' : 's'}`"
                            :tone="findings.length > 0 ? 'warn' : 'neutral'"
                            icon="i-lucide-boxes"
                            to="/projects"
                        />
                        <StatTile
                            label="Open issues"
                            :value="issues.error ? '—' : open"
                            :hint="issues.error ? 'GitHub could not be read' : issuesRead"
                            :tone="issues.error ? 'warn' : 'neutral'"
                            icon="i-lucide-circle-dot"
                            to="/issues"
                        />
                        <StatTile
                            label="Vulnerabilities"
                            :value="deps?.vulnerabilities ? advisories : '—'"
                            :hint="
                                deps?.vulnerabilities
                                    ? advisories === 0
                                        ? 'none known'
                                        : `worst: ${worstSeverity}`
                                    : 'not collected'
                            "
                            :tone="vulnerabilityTone"
                            icon="i-lucide-shield-alert"
                            to="/deps"
                        />
                    </div>

                    <UCard
                        v-if="findings.length > 0 || broken.length > 0"
                        :ui="{ body: 'flex flex-col gap-3' }"
                    >
                        <template #header>
                            <div>
                                <h3 class="font-semibold">Needs attention</h3>
                                <p class="text-xs text-muted">
                                    Two files that have to agree and no longer do, or a link that
                                    resolves to nothing. Both are checked on every collect rather
                                    than only while an agent is editing.
                                </p>
                            </div>
                        </template>

                        <UAlert
                            v-for="finding in findings"
                            :key="finding.id"
                            color="warning"
                            variant="subtle"
                            icon="i-lucide-unlink"
                            :title="finding.title"
                            :description="finding.detail"
                        />

                        <NuxtLink
                            v-for="page in broken"
                            :key="page.path"
                            :to="`/docs${toCollectionPath(page.path)}`"
                            class="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated/50"
                        >
                            <UIcon name="i-lucide-link-2-off" class="size-4 shrink-0 text-dimmed" />
                            <span class="truncate font-mono text-xs">{{ page.path }}</span>
                            <span class="truncate text-xs text-muted">
                                {{ page.brokenLinks.map((link) => link.href).join(", ") }}
                            </span>
                        </NuxtLink>
                    </UCard>

                    <UCard variant="flush">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h3 class="font-semibold">Work in progress</h3>
                                <UButton
                                    to="/issues"
                                    label="All issues"
                                    size="xs"
                                    variant="ghost"
                                    color="neutral"
                                    trailing-icon="i-lucide-arrow-right"
                                />
                            </div>
                        </template>

                        <div v-if="next.length === 0" class="p-8 text-center text-sm text-muted">
                            {{
                                issues.error
                                    ? "GitHub could not be read from this browser."
                                    : "No open issues."
                            }}
                        </div>

                        <div v-else class="divide-y divide-default">
                            <IssueRow v-for="issue in next" :key="issue.number" :issue compact />
                        </div>
                    </UCard>
                </section>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { sortIssues } from "#layers/github/shared/issues.ts";
import { toCollectionPath } from "#layers/docs/shared/docPages.ts";
import type { ProjectNode } from "#layers/snapshot/shared/types.ts";

const [
    { data: projectsSnapshot },
    { data: coverageSnapshot },
    { data: docsSnapshot },
    { data: depsSnapshot },
    { data: metricsSnapshot },
] = await Promise.all([
    useSnapshot("projects"),
    useSnapshot("coverage"),
    useSnapshot("docs"),
    useSnapshot("deps"),
    useSnapshot("metrics"),
]);
const { data: issues } = useIssues();

const open = computed(() => issues.value.issues.length);
const issuesRead = computed(() =>
    issues.value.fetchedAt ? `read ${relativeTime(issues.value.fetchedAt)}` : "reading…",
);

const coverage = computed(() => coverageSnapshot.value?.coverage?.totals?.lines ?? null);
const coverageTileTone = computed(() => coverageTone(coverage.value));
const projectNodes = computed(() => projectsSnapshot.value?.projects?.projects ?? []);
const projects = computed(() => projectNodes.value.length);
const docs = computed(() => docsSnapshot.value?.docs ?? null);

const { data: readmes } = await useAsyncData("overview-readmes", () =>
    queryCollection("docs").select("path", "title", "description").all(),
);

const readmeByPath = computed(
    () => new Map((readmes.value ?? []).map((page) => [page.path, page])),
);
const repositoryReadme = computed(() => readmeByPath.value.get("/readme"));
const featuredProjects = computed(() =>
    projectNodes.value.filter((project) => project.root.startsWith("apps/")),
);

const readmeFor = (project: ProjectNode) =>
    readmeByPath.value.get(`/${project.root.toLowerCase()}/readme`);

const deps = computed(() => depsSnapshot.value?.deps ?? null);
const advisories = computed(() => deps.value?.advisories.length ?? 0);

/** The tile shows one number, so it takes the tone of the worst band rather than the total count. */
const worstSeverity = computed(() => {
    const counts = deps.value?.vulnerabilities;

    if (!counts) return null;

    return (
        (["critical", "high", "moderate", "low", "info"] as const).find(
            (severity) => counts[severity] > 0,
        ) ?? null
    );
});

const vulnerabilityTone = computed(() =>
    worstSeverity.value ? severityTone(worstSeverity.value) : "neutral",
);

const findings = computed(() => metricsSnapshot.value?.metrics?.invariantFindings ?? []);

/** Only the pages that actually have one — a list of every doc with zero broken links is a wall. */
const broken = computed(
    () => docs.value?.pages.filter((page) => page.brokenLinks.length > 0) ?? [],
);

const next = computed(() => sortIssues(issues.value.issues).slice(0, 6));
</script>
