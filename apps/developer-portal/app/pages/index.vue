<script setup lang="ts">
import { sortIssues } from "#shared/issues.ts";
import { toCollectionPath } from "#shared/wiki.ts";
import type { ProjectNode } from "#shared/types.ts";

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
const { data: issues } = await useIssues();
const { data: reviews } = await useReviewPages();

const open = computed(() => issues.value.issues.length);

const coverage = computed(() => coverageSnapshot.value?.coverage?.totals?.lines ?? null);
const projectNodes = computed(() => projectsSnapshot.value?.projects?.projects ?? []);
const projects = computed(() => projectNodes.value.length);
const docs = computed(() => docsSnapshot.value?.docs ?? null);

const { data: readmes } = await useAsyncData("overview-readmes", () =>
    queryCollection("docs").select("path", "title", "description").all());

const readmeByPath = computed(() => new Map((readmes.value ?? []).map((page) => [page.path, page])));
const repositoryReadme = computed(() => readmeByPath.value.get("/readme"));
const featuredProjects = computed(() => projectNodes.value.filter((project) => project.root.startsWith("apps/")));

function readmeFor(project: ProjectNode) {
    return readmeByPath.value.get(`/${project.root.toLowerCase()}/readme`);
}

const deps = computed(() => depsSnapshot.value?.deps ?? null);
const advisories = computed(() => deps.value?.advisories.length ?? 0);

/** The tile shows one number, so it takes the tone of the worst band rather than the total count. */
const worstSeverity = computed(() => {
    const counts = deps.value?.vulnerabilities;

    if (!counts) return null;

    return (["critical", "high", "moderate", "low", "info"] as const).find((severity) => counts[severity] > 0) ?? null;
});

const findings = computed(() => metricsSnapshot.value?.metrics?.invariantFindings ?? []);

/** Only the pages that actually have one — a list of every doc with zero broken links is a wall. */
const broken = computed(() => docs.value?.pages.filter((page) => page.brokenLinks.length > 0) ?? []);

const next = computed(() => sortIssues(issues.value.issues).slice(0, 6));
</script>

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
                        <p class="text-sm text-muted mt-1">
                            {{ repositoryReadme?.description ?? "The repository summary is not available yet." }}
                        </p>
                    </div>

                    <div class="grid gap-3 md:grid-cols-3">
                        <NuxtLink
                            to="/projects"
                            class="rounded-lg border border-default bg-default p-4 hover:bg-elevated/50 transition-colors"
                        >
                            <UIcon
name="i-lucide-boxes"
class="size-5 text-primary"
/>
                            <h2 class="mt-3 font-semibold">
Explore what exists
</h2>
                            <p class="text-sm text-muted mt-1">
Browse the applications, building blocks, and tooling.
</p>
                        </NuxtLink>
                        <NuxtLink
                            to="/graph"
                            class="rounded-lg border border-default bg-default p-4 hover:bg-elevated/50 transition-colors"
                        >
                            <UIcon
name="i-lucide-git-fork"
class="size-5 text-primary"
/>
                            <h2 class="mt-3 font-semibold">
Understand how it works
</h2>
                            <p class="text-sm text-muted mt-1">
See how projects fit together and share responsibilities.
</p>
                        </NuxtLink>
                        <NuxtLink
                            to="/docs/docs/guides/first-hour"
                            class="rounded-lg border border-default bg-default p-4 hover:bg-elevated/50 transition-colors"
                        >
                            <UIcon
name="i-lucide-play"
class="size-5 text-primary"
/>
                            <h2 class="mt-3 font-semibold">
Run or contribute
</h2>
                            <p class="text-sm text-muted mt-1">
Get a working checkout and find your first useful step.
</p>
                        </NuxtLink>
                    </div>
                </section>

                <section class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <h2 class="text-xl font-semibold">
Featured projects
</h2>
                            <p class="text-sm text-muted mt-1">
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
                            :ui="{ root: 'h-full flex flex-col', header: 'flex-1', body: 'mt-auto' }"
                        >
                            <template #header>
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <h3 class="font-semibold">
                                            {{ readmeFor(project)?.title ?? project.name }}
                                        </h3>
                                        <p class="line-clamp-3 text-sm text-muted mt-1">
                                            {{ readmeFor(project)?.description ?? "No project description is available yet." }}
                                        </p>
                                    </div>
                                    <UBadge
label="Application"
color="primary"
variant="subtle"
/>
                                </div>
                            </template>
                            <div class="flex items-center justify-between gap-3">
                                <span class="font-mono text-xs text-dimmed truncate">{{ project.root }}</span>
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
                        <h2 class="text-xl font-semibold">
Engineering health
</h2>
                        <p class="text-sm text-muted mt-1">
Collected repository signals and live work in progress.
</p>
                    </div>

                    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatTile
                            label="Docs"
                            :value="docs?.pages.length ?? '—'"
                            :hint="docs
                                ? docs.brokenLinkCount === 0
                                    ? 'no broken links'
                                    : `${docs.brokenLinkCount} broken link${docs.brokenLinkCount === 1 ? '' : 's'}`
                                : 'not collected'"
                            :tone="(docs?.brokenLinkCount ?? 0) > 0 ? 'warn' : 'neutral'"
                            icon="i-lucide-book-open"
                            to="/docs"
                        />
                        <StatTile
                            label="Line coverage"
                            :value="coverage === null ? '—' : `${coverage}%`"
                            hint="weighted, collected projects only"
                            :tone="coverageTone(coverage)"
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
                            :hint="issues.error
                                ? 'GitHub could not be read'
                                : issues.fetchedAt ? `read ${relativeTime(issues.fetchedAt)}` : 'reading…'"
                            :tone="issues.error ? 'warn' : 'neutral'"
                            icon="i-lucide-circle-dot"
                            to="/issues"
                        />
                        <StatTile
                            label="Vulnerabilities"
                            :value="deps?.vulnerabilities ? advisories : '—'"
                            :hint="deps?.vulnerabilities
                                ? advisories === 0
                                    ? 'none known'
                                    : `worst: ${worstSeverity}`
                                : 'not collected'"
                            :tone="worstSeverity ? severityTone(worstSeverity) : 'neutral'"
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
                                <h3 class="font-semibold">
Needs attention
</h3>
                                <p class="text-xs text-muted">
                                    Two files that have to agree and no longer do, or a link that resolves to nothing.
                                    Both are checked on every collect rather than only while an agent is editing.
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
                            class="flex items-center gap-3 text-sm hover:bg-elevated/40 rounded-md px-2 py-1.5 transition-colors"
                        >
                            <UIcon
name="i-lucide-link-2-off"
class="size-4 text-dimmed shrink-0"
/>
                            <span class="font-mono text-xs truncate">{{ page.path }}</span>
                            <span class="text-xs text-muted truncate">
                                {{ page.brokenLinks.map((link) => link.href).join(", ") }}
                            </span>
                        </NuxtLink>
                    </UCard>

                    <div class="grid lg:grid-cols-3 gap-4">
                        <UCard
class="lg:col-span-2"
:ui="{ body: 'p-0 sm:p-0' }"
>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="font-semibold">
Work in progress
</h3>
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

                            <div
v-if="next.length === 0"
class="p-8 text-center text-sm text-muted"
>
                                {{ issues.error ? "GitHub could not be read from this browser." : "No open issues." }}
                            </div>

                            <div
v-else
class="divide-y divide-default"
>
                                <IssueRow
v-for="issue in next"
:key="issue.number"
:issue="issue"
compact
/>
                            </div>
                        </UCard>

                        <UCard
class="self-start"
:ui="{ body: 'p-0 sm:p-0' }"
>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="font-semibold">
Reviews
</h3>
                                    <UButton
                                        to="/reviews"
                                        label="All"
                                        size="xs"
                                        variant="ghost"
                                        color="neutral"
                                        trailing-icon="i-lucide-arrow-right"
                                    />
                            </div>
                        </template>

                            <div
v-if="reviews.length === 0"
class="p-8 text-center text-sm text-muted"
>
                                No review written yet.
                            </div>

                            <div
v-else
class="divide-y divide-default"
>
                                <NuxtLink
                                    v-for="review in reviews.slice(0, 5)"
                                    :key="review.path"
                                    :to="`/reviews/${review.path.split('/').at(-1)}`"
                                    class="flex items-center gap-3 px-4 py-2.5 hover:bg-elevated/40 transition-colors"
                                >
                                    <UIcon
name="i-lucide-clipboard-check"
class="size-4 text-dimmed shrink-0"
/>
                                    <span class="text-sm font-mono truncate">{{ review.path.split("/").at(-1) }}</span>
                                </NuxtLink>
                            </div>
                        </UCard>
                    </div>
                </section>
            </div>
        </template>
    </UDashboardPanel>
</template>
