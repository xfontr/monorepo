<template>
    <UDashboardPanel id="overview">
        <template #header>
            <UDashboardNavbar title="Overview">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <SnapshotAge class="mr-3" :manifest="docsSnapshot?.manifest ?? null" />
                    <UButton
                        :label="editing ? 'Done' : 'Customize'"
                        :icon="editing ? 'i-lucide-check' : 'i-lucide-layout-grid'"
                        size="sm"
                        :variant="editing ? 'solid' : 'soft'"
                        @click="editing = !editing"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <DashboardGrid
                v-model:editing="editing"
                :widgets="WIDGETS"
                :empty="emptyWidgets"
                storage-key="overview-layout"
            >
                <template #welcome>
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

                        <div class="grid gap-3 @2xl:grid-cols-3">
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
                </template>

                <template #featured>
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

                        <div class="grid gap-4 @4xl:grid-cols-2">
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
                                        <UBadge
                                            label="Application"
                                            color="primary"
                                            variant="subtle"
                                        />
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
                </template>

                <template #workflows>
                    <section class="flex flex-col gap-3">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h2 class="text-xl font-semibold">Active workflows</h2>
                                <p class="mt-1 text-sm text-muted">
                                    Projects still working through their workflow map.
                                </p>
                            </div>
                            <UButton
                                to="/workflows"
                                label="All workflows"
                                size="xs"
                                variant="ghost"
                                color="neutral"
                                trailing-icon="i-lucide-arrow-right"
                            />
                        </div>

                        <div class="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
                            <WorkflowCard
                                v-for="view in activeWorkflows"
                                :key="view.project.id"
                                :project="view"
                            />
                            <NewProjectCard />
                        </div>
                    </section>
                </template>

                <template #docs>
                    <StatTile
                        class="h-full"
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
                </template>

                <template #coverage>
                    <StatTile
                        class="h-full"
                        label="Line coverage"
                        :value="coverage === null ? '—' : `${coverage}%`"
                        hint="weighted, collected projects only"
                        :tone="coverageTileTone"
                        icon="i-lucide-shield-check"
                        to="/coverage"
                    />
                </template>

                <template #projects>
                    <StatTile
                        class="h-full"
                        label="Projects"
                        :value="projects"
                        :hint="`${findings.length} invariant finding${findings.length === 1 ? '' : 's'}`"
                        :tone="findings.length > 0 ? 'warn' : 'neutral'"
                        icon="i-lucide-boxes"
                        to="/projects"
                    />
                </template>

                <template #issues>
                    <StatTile
                        class="h-full"
                        label="Open issues"
                        :value="issues.error ? '—' : open"
                        :hint="issues.error ? 'GitHub could not be read' : issuesRead"
                        :tone="issues.error ? 'warn' : 'neutral'"
                        icon="i-lucide-circle-dot"
                        to="/issues"
                    />
                </template>

                <template #vulnerabilities>
                    <StatTile
                        class="h-full"
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
                </template>

                <template #attention>
                    <UCard class="h-full" :ui="{ body: 'flex flex-col gap-3' }">
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

                        <p
                            v-if="findings.length === 0 && broken.length === 0"
                            class="p-4 text-center text-sm text-muted"
                        >
                            Nothing needs attention.
                        </p>

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
                </template>

                <template #work>
                    <UCard class="h-full" variant="flush">
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
                                    : issues.fetchedAt
                                      ? "No open issues."
                                      : "Reading open issues…"
                            }}
                        </div>

                        <div v-else class="divide-y divide-default">
                            <IssueRow v-for="issue in next" :key="issue.number" :issue compact />
                        </div>
                    </UCard>
                </template>
                <template #decisions>
                    <UCard class="h-full" variant="flush">
                        <template #header>
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <h3 class="font-semibold">Decisions to implement</h3>
                                    <p class="text-xs text-muted">
                                        {{ decisionCounts["implemented"] }} implemented ·
                                        {{ decisionCounts["to-implement"] }} to implement ·
                                        {{ decisionCounts["wont-implement"] }} won't implement
                                    </p>
                                </div>
                                <UButton
                                    to="/decisions"
                                    label="All decisions"
                                    size="xs"
                                    variant="ghost"
                                    color="neutral"
                                    trailing-icon="i-lucide-arrow-right"
                                />
                            </div>
                        </template>

                        <p
                            v-if="pendingDecisions.length === 0"
                            class="p-8 text-center text-sm text-muted"
                        >
                            {{
                                decisionReports.length === 0
                                    ? "No decisions collected yet."
                                    : "Every accepted decision has landed."
                            }}
                        </p>

                        <div v-else class="divide-y divide-default">
                            <NuxtLink
                                v-for="report in pendingDecisions"
                                :key="report.id"
                                :to="`/decisions/${report.id}`"
                                class="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-elevated/50"
                            >
                                <span class="shrink-0 font-mono text-xs text-dimmed">
                                    {{ report.number }}
                                </span>
                                <span class="truncate">{{ report.title }}</span>
                            </NuxtLink>
                        </div>
                    </UCard>
                </template>

                <template #audits>
                    <UCard class="h-full" variant="flush">
                        <template #header>
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <h3 class="font-semibold">Open audit findings</h3>
                                    <p class="text-xs text-muted">
                                        {{ auditTotals.findings.open }} open across
                                        {{ openAudits.length }}
                                        {{ openAudits.length === 1 ? "audit" : "audits" }}
                                    </p>
                                </div>
                                <UButton
                                    to="/audits"
                                    label="All audits"
                                    size="xs"
                                    variant="ghost"
                                    color="neutral"
                                    trailing-icon="i-lucide-arrow-right"
                                />
                            </div>
                        </template>

                        <p
                            v-if="openAudits.length === 0"
                            class="p-8 text-center text-sm text-muted"
                        >
                            {{
                                auditReports.length === 0
                                    ? "No audits collected yet."
                                    : "Every audit is closed."
                            }}
                        </p>

                        <div v-else class="divide-y divide-default">
                            <NuxtLink
                                v-for="report in topAudits"
                                :key="report.id"
                                :to="`/audits/${report.id}`"
                                class="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-elevated/50"
                            >
                                <div class="min-w-0 flex-1">
                                    <p class="truncate">{{ report.title }}</p>
                                    <p class="text-xs text-muted">
                                        {{ report.counts.open }} of
                                        {{ report.findings.length }} open
                                    </p>
                                </div>
                                <UProgress
                                    :model-value="report.findings.length - report.counts.open"
                                    :max="Math.max(report.findings.length, 1)"
                                    size="sm"
                                    class="w-20 shrink-0"
                                />
                            </NuxtLink>
                        </div>
                    </UCard>
                </template>

                <template #tooling>
                    <UCard class="h-full" :ui="{ body: 'flex flex-col gap-4' }">
                        <template #header>
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <h3 class="font-semibold">Tooling usage</h3>
                                    <p class="text-xs text-muted">
                                        Repo scripts over the last {{ WINDOW_DAYS }} days
                                    </p>
                                </div>
                                <UButton
                                    to="/telemetry"
                                    label="Details"
                                    size="xs"
                                    variant="ghost"
                                    color="neutral"
                                    trailing-icon="i-lucide-arrow-right"
                                />
                            </div>
                        </template>

                        <p v-if="!usageTotals" class="text-center text-sm text-muted">
                            Not collected.
                        </p>

                        <template v-else>
                            <dl class="grid grid-cols-3 gap-3">
                                <div>
                                    <dt class="text-xs text-muted">Runs</dt>
                                    <dd class="text-2xl font-semibold tabular-nums">
                                        {{ usageTotals.runs }}
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-xs text-muted">By agents</dt>
                                    <dd class="text-2xl font-semibold tabular-nums">
                                        {{ usageTotals.agentShare }}%
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-xs text-muted">Failed</dt>
                                    <dd
                                        class="text-2xl font-semibold tabular-nums"
                                        :class="usageTotals.failedClass"
                                    >
                                        {{ usageTotals.failureRate }}%
                                    </dd>
                                </div>
                            </dl>

                            <div class="flex flex-col gap-1 text-sm">
                                <p
                                    v-for="script in usageTotals.failingScripts"
                                    :key="script.name"
                                    class="flex items-center gap-2"
                                >
                                    <UIcon
                                        name="i-lucide-circle-x"
                                        class="tone-bad size-4 shrink-0"
                                    />
                                    <span class="truncate font-mono text-xs">{{
                                        script.name
                                    }}</span>
                                    <span class="ml-auto text-xs text-muted">
                                        {{ script.failed }}% failed
                                    </span>
                                </p>
                                <p
                                    v-if="usageTotals.failingScripts.length === 0"
                                    class="text-xs text-muted"
                                >
                                    No script is failing.
                                </p>
                                <p v-if="usageTotals.idle > 0" class="text-xs text-muted">
                                    {{ usageTotals.idle }}
                                    {{ usageTotals.idle === 1 ? "script" : "scripts" }} never run in
                                    the window.
                                </p>
                            </div>
                        </template>
                    </UCard>
                </template>
            </DashboardGrid>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { sortIssues } from "#layers/github/shared/issues.ts";
import { toCollectionPath } from "#layers/docs/shared/docPages.ts";
import type { ProjectNode } from "#layers/snapshot/shared/types.ts";
import { activeProjects } from "#layers/workflows/shared/workflows.ts";
import { countByStatus, sortDecisions } from "#layers/decisions/shared/decisionReports.ts";
import { countAll, sortAudits } from "#layers/audits/shared/auditReports.ts";
import { WINDOW_DAYS } from "#layers/telemetry/shared/usage.ts";
import { isFailing, scriptRows, sumDays } from "#layers/telemetry/shared/usageView.ts";

const WIDGETS: WidgetDefinition[] = [
    { id: "welcome", label: "Welcome", icon: "i-lucide-house", size: "wide" },
    { id: "docs", label: "Docs", icon: "i-lucide-book-open", size: "small" },
    { id: "coverage", label: "Line coverage", icon: "i-lucide-shield-check", size: "small" },
    { id: "issues", label: "Open issues", icon: "i-lucide-circle-dot", size: "small" },
    {
        id: "vulnerabilities",
        label: "Vulnerabilities",
        icon: "i-lucide-shield-alert",
        size: "small",
    },
    { id: "work", label: "Work in progress", icon: "i-lucide-list-todo", size: "medium" },
    { id: "attention", label: "Needs attention", icon: "i-lucide-unlink", size: "medium" },
    { id: "decisions", label: "Decisions to implement", icon: "i-lucide-scale", size: "medium" },
    { id: "audits", label: "Open audit findings", icon: "i-lucide-search-check", size: "medium" },
    { id: "tooling", label: "Tooling usage", icon: "i-lucide-wrench", size: "medium" },
    { id: "featured", label: "Featured projects", icon: "i-lucide-star", size: "wide" },
    { id: "workflows", label: "Active workflows", icon: "i-lucide-workflow", size: "wide" },
    // Its hint repeats the invariant findings Needs attention already lists.
    { id: "projects", label: "Projects", icon: "i-lucide-boxes", size: "small", hidden: true },
];

const editing = ref(false);

const [
    { data: projectsSnapshot },
    { data: coverageSnapshot },
    { data: docsSnapshot },
    { data: depsSnapshot },
    { data: metricsSnapshot },
    { data: usageSnapshot },
] = await Promise.all([
    useSnapshot("projects"),
    useSnapshot("coverage"),
    useSnapshot("docs"),
    useSnapshot("deps"),
    useSnapshot("metrics"),
    useSnapshot("usage"),
]);
const { data: read } = useIssues();
const mounted = ref(false);
onMounted(() => (mounted.value = true));
// The server never reads GitHub, so until hydration ends every client render must match "reading".
const issues = computed(() =>
    mounted.value ? read.value : { fetchedAt: "", error: null, issues: [] },
);

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
    projectNodes.value.filter((project) => project.root.startsWith("apps/")).slice(0, 2),
);

const { data: workflows } = await useWorkflows();

const activeWorkflows = computed(() => activeProjects(workflows.value.projects));

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

const emptyWidgets = computed(() =>
    findings.value.length === 0 && broken.value.length === 0 ? ["attention"] : [],
);

const decisionReports = useDecisionReports();
const decisionCounts = computed(() => countByStatus(decisionReports.value));
const pendingDecisions = computed(() =>
    sortDecisions(decisionReports.value, "newest")
        .filter((report) => report.status === "to-implement" && report.decision !== "superseded")
        .slice(0, 5),
);

const auditReports = useAuditReports();
const auditTotals = computed(() => countAll(auditReports.value));
const openAudits = computed(() =>
    sortAudits(auditReports.value, "most-open").filter((report) => report.state !== "closed"),
);
const topAudits = computed(() => openAudits.value.slice(0, 4));

const usageTotals = computed(() => {
    const usage = usageSnapshot.value?.usage;

    if (!usage) return null;

    const rows = scriptRows(usage);
    const sum = sumDays(rows);

    return {
        runs: sum.runs,
        agentShare: percentOf(sum.agent, sum.runs),
        failureRate: percentOf(sum.failures, sum.runs),
        failedClass: toneClass(isFailing(sum) ? "bad" : "neutral"),
        failingScripts: rows
            .filter((row) => row.failing)
            .map((row) => ({ name: row.name, failed: percentOf(row.failures, row.runs) })),
        idle: rows.filter((row) => row.runs === 0).length,
    };
});
</script>
