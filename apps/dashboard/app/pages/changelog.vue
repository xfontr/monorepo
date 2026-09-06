<script setup lang="ts">
const { data: snapshot } = await useSnapshot();

const { data: changelogs } = await useAsyncData("changelogs", () =>
    queryCollection("docs")
        .where("path", "LIKE", "%/CHANGELOG")
        .select("path", "title")
        .all(), { default: () => [] });

const selected = ref<string | null>(null);

watchEffect(() => {
    if (selected.value === null) selected.value = changelogs.value[0]?.path ?? null;
});

const { data: page } = await useAsyncData(
    () => `changelog-${selected.value ?? "none"}`,
    () => (selected.value === null ? Promise.resolve(null) : queryCollection("docs").path(selected.value).first()),
    { watch: [selected] },
);

/** `packages/ui/CHANGELOG` → `packages/ui`, which is how metrics keys its projects. */
function rootOf(path: string): string {
    return path.replace(/^\//, "").replace(/\/CHANGELOG$/, "");
}

const metrics = computed(() => snapshot.value?.metrics?.projects ?? []);

function metricsFor(path: string) {
    return metrics.value.find((project) => project.root === rootOf(path));
}

/** Projects that have shipped commits but no CHANGELOG.md — the gap this page should surface. */
const unreleased = computed(() =>
    metrics.value.filter((project) => !project.hasChangelog && (project.unreleasedCommits ?? 0) > 0));

const conventional = computed(() => snapshot.value?.metrics?.conventionalCommitRate ?? null);
</script>

<template>
    <UDashboardPanel id="changelog">
        <template #header>
            <UDashboardNavbar title="Changelog">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="text-xs text-muted">
                        {{ snapshot?.metrics?.commitsSinceLastRelease ?? "—" }} commits since the last release
                    </span>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div
                v-if="changelogs.length === 0"
                class="p-12 text-center"
            >
                <UIcon
                    name="i-lucide-tag"
                    class="size-8 text-dimmed mx-auto mb-2"
                />
                <p class="text-sm text-muted">
                    No CHANGELOG.md in the workspace yet.
                </p>
                <p class="text-xs text-dimmed mt-1">
                    They are written by <code class="font-mono">nx release</code>, never by hand.
                </p>
            </div>

            <div
                v-else
                class="grid lg:grid-cols-4 gap-4"
            >
                <div class="flex flex-col gap-3">
                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <div class="divide-y divide-default">
                            <button
                                v-for="entry in changelogs"
                                :key="entry.path"
                                type="button"
                                class="w-full text-left px-4 py-2.5 hover:bg-elevated/40 transition-colors"
                                :class="selected === entry.path ? 'bg-elevated/60' : ''"
                                @click="selected = entry.path"
                            >
                                <div class="text-sm font-mono truncate">
                                    {{ rootOf(entry.path) }}
                                </div>
                                <div class="text-xs text-dimmed flex items-center gap-2">
                                    <span v-if="metricsFor(entry.path)?.currentVersion">v{{ metricsFor(entry.path)?.currentVersion }}</span>
                                    <span
                                        v-if="(metricsFor(entry.path)?.unreleasedCommits ?? 0) > 0"
                                        class="tone-warn"
                                    >+{{ metricsFor(entry.path)?.unreleasedCommits }} unreleased</span>
                                </div>
                            </button>
                        </div>
                    </UCard>

                    <UAlert
                        v-if="unreleased.length > 0"
                        color="warning"
                        variant="subtle"
                        icon="i-lucide-package-open"
                        title="Never released"
                        :description="`${unreleased.map((project) => project.name).join(', ')} — commits since the last tag but no changelog.`"
                    />

                    <!-- Both changelogs and versions are derived from commit subjects, so a subject
                         commitlint would have rejected is a line that silently never ships. -->
                    <UAlert
                        v-if="conventional !== null"
                        :color="conventional === 100 ? 'neutral' : 'warning'"
                        variant="subtle"
                        icon="i-lucide-git-commit-horizontal"
                        title="Conventional subjects"
                        :description="`${conventional}% of the last 100 commits parse as a version bump.`"
                        :ui="{ description: 'text-xs' }"
                    />
                </div>

                <UCard class="lg:col-span-3">
                    <ContentRenderer
                        v-if="page"
                        :value="page"
                    />
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
