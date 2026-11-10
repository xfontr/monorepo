<template>
    <UDashboardPanel id="changelog">
        <template #header>
            <UDashboardNavbar title="What's new">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="text-xs text-muted">
                        {{ snapshot?.metrics?.commitsSinceLastRelease ?? "—" }} commits since the
                        last release
                    </span>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <p class="max-w-3xl text-sm text-muted">
                    This page brings together generated release histories and unreleased activity
                    across the workspace.
                </p>

                <div v-if="changelogs.length === 0" class="p-12 text-center">
                    <UIcon name="i-lucide-tag" class="mx-auto mb-2 size-8 text-dimmed" />
                    <p class="text-sm text-muted">No CHANGELOG.md in the workspace yet.</p>
                    <p class="mt-1 text-xs text-dimmed">
                        They are written by <code class="font-mono">nx release</code>, never by
                        hand.
                    </p>
                </div>

                <div v-else class="grid gap-4 lg:grid-cols-4">
                    <div class="flex flex-col gap-3">
                        <UCard variant="flush">
                            <div class="divide-y divide-default">
                                <button
                                    v-for="entry in changelogs"
                                    :key="entry.path"
                                    type="button"
                                    class="w-full px-4 py-2.5 text-left transition-colors hover:bg-elevated/50"
                                    :class="selected === entry.path ? 'bg-elevated' : ''"
                                    @click="selected = entry.path"
                                >
                                    <div class="truncate font-mono text-sm">
                                        {{ displayName(rootOf(entry.path)) }}
                                    </div>
                                    <div class="flex items-center gap-2 text-xs text-dimmed">
                                        <span v-if="metricsFor(entry.path)?.currentVersion"
                                            >v{{ metricsFor(entry.path)?.currentVersion }}</span
                                        >
                                        <span
                                            v-if="
                                                (metricsFor(entry.path)?.unreleasedCommits ?? 0) > 0
                                            "
                                            class="tone-warn"
                                            >+{{
                                                metricsFor(entry.path)?.unreleasedCommits
                                            }}
                                            unreleased</span
                                        >
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
                            :description="`${unreleasedNames} — commits waiting on a first release, so no changelog yet.`"
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
                        <ContentRenderer v-if="page" :value="page" />
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { toTitleCase } from "#layers/docs/shared/docPages.ts";

const { data: snapshot } = await useSnapshot("metrics");

const { data: changelogs } = await useAsyncData(
    "changelogs",
    () =>
        queryCollection("docs").where("path", "LIKE", "%/CHANGELOG").select("path", "title").all(),
    { default: () => [] },
);

const selected = ref<string | null>(null);

watchEffect(() => {
    if (selected.value === null) selected.value = changelogs.value[0]?.path ?? null;
});

const { data: page } = await useAsyncData(
    () => `changelog-${selected.value ?? "none"}`,
    () =>
        selected.value === null
            ? Promise.resolve(null)
            : queryCollection("docs").path(selected.value).first(),
    { watch: [selected] },
);

/** `packages/ui/changelog` → `packages/ui`, which is how metrics keys its projects. */
const rootOf = (path: string): string => path.replace(/^\//, "").replace(/\/changelog$/i, "");

/** `packages/i18n` → `I18n` — the project's own name, not the area it lives under. */
const displayName = (root: string): string => toTitleCase(root.split("/").at(-1) ?? root);

const metrics = computed(() => snapshot.value?.metrics?.projects ?? []);

const metricsFor = (path: string) => metrics.value.find((project) => project.root === rootOf(path));

/** Projects that have shipped commits but no CHANGELOG.md — the gap this page should surface. */
const unreleased = computed(() =>
    metrics.value.filter(
        (project) => !project.hasChangelog && (project.unreleasedCommits ?? 0) > 0,
    ),
);

const unreleasedNames = computed(() =>
    unreleased.value.map((project) => displayName(project.root)).join(", "),
);

const conventional = computed(() => snapshot.value?.metrics?.conventionalCommitRate ?? null);
</script>
