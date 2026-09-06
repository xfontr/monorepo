<script setup lang="ts">
import { sortIssues } from "../../shared/issues.ts";
import { toCollectionPath } from "../../shared/wiki.ts";

const { data: snapshot } = await useSnapshot();
const { data: issues } = await useIssues();
const { data: reviews } = await useReviewPages();

const open = computed(() => issues.value.issues.length);

/** Filed and never placed on a board — the set that quietly stops being looked at. */
const unplaced = computed(() => issues.value.issues.filter((issue) => issue.project === null).length);

const coverage = computed(() => snapshot.value?.coverage?.totals?.lines ?? null);
const projects = computed(() => snapshot.value?.projects?.projects.length ?? 0);
const docs = computed(() => snapshot.value?.docs ?? null);

const findings = computed(() => snapshot.value?.metrics?.invariantFindings ?? []);

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
                    <SnapshotAge :manifest="snapshot?.manifest ?? null" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                        to="/graph"
                    />
                    <StatTile
                        label="Open issues"
                        :value="issues.error ? '—' : open"
                        :hint="issues.error
                            ? 'gh could not be reached'
                            : unplaced > 0
                                ? `${unplaced} on no board`
                                : 'all on a board'"
                        :tone="issues.error || unplaced > 0 ? 'warn' : 'neutral'"
                        icon="i-lucide-circle-dot"
                        to="/issues"
                    />
                </div>

                <UCard
                    v-if="findings.length > 0 || broken.length > 0"
                    :ui="{ body: 'flex flex-col gap-3' }"
                >
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                Needs attention
                            </h2>
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
                                <h2 class="font-semibold">
                                    What's next
                                </h2>
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
                            {{ issues.error ? "GitHub could not be reached — this reads the gh CLI." : "No open issues." }}
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
                                <h2 class="font-semibold">
                                    Reviews
                                </h2>
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
                                <span class="text-sm font-mono truncate">
                                    {{ review.path.split("/").at(-1) }}
                                </span>
                            </NuxtLink>
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
