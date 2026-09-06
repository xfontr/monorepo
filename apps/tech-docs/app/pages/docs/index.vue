<script setup lang="ts">
import { toCollectionPath } from "../../../shared/wiki.ts";

const { data: snapshot } = await useSnapshot();
const { data: sections } = await useWiki();
const spikeStatuses = useSpikeStatuses();

const pages = computed(() => snapshot.value?.docs?.pages ?? []);

const count = computed(() => sections.value.reduce(
    (sum, section) => sum + section.groups.reduce((inner, group) => inner + group.entries.length, 0),
    0,
));

/**
 * A wiki's front page is the one page that has to be opinionated: everything else is reachable from
 * the tree on the left, so this says where to *start*. The four are the ordered answer to "I have
 * never seen this repo" — what it is, how to work in it, what it can do, what to run first.
 */
const START = [
    { path: "/readme", label: "The repo", hint: "Layout, boundaries, commands", icon: "i-lucide-map" },
    { path: "/claude", label: "Working here", hint: "The rules that get got wrong", icon: "i-lucide-bot" },
    { path: "/docs/features", label: "Features", hint: "Every command, hook and skill", icon: "i-lucide-list-tree" },
    { path: "/docs/guides/first-hour", label: "First hour", hint: "An ordered way in", icon: "i-lucide-play" },
];

const known = computed(() => new Set(sections.value.flatMap((section) =>
    section.groups.flatMap((group) => group.entries.map((entry) => entry.path)))));

/** A curated list is the one thing here that can rot; a renamed doc drops off it rather than 404s. */
const start = computed(() => START.filter((entry) => known.value.has(entry.path)));

const recent = computed(() => pages.value
    .filter((page) => page.updatedAt !== null && known.value.has(toCollectionPath(page.path)))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 8));

const broken = computed(() => pages.value.filter((page) => page.brokenLinks.length > 0));
</script>

<template>
    <UDashboardPanel id="docs">
        <template #header>
            <UDashboardNavbar title="Wiki">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="text-xs text-muted">{{ count }} pages, read in place</span>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex gap-6 items-start">
                <aside class="hidden lg:block w-60 shrink-0 sticky top-0">
                    <WikiNav
                        :sections="sections"
                        :spike-statuses="spikeStatuses"
                    />
                </aside>

                <div class="flex-1 min-w-0 flex flex-col gap-6">
                    <div>
                        <h1 class="text-xl font-semibold">
                            The workspace, as it is written
                        </h1>
                        <p class="text-sm text-muted mt-1 max-w-2xl">
                            Every markdown file in the repo, rendered from where it lives. The README you edit for
                            GitHub is the page you read here, so the two cannot drift. Press
                            <UKbd value="meta" /><UKbd value="K" /> to search all of it.
                        </p>
                    </div>

                    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <NuxtLink
                            v-for="entry in start"
                            :key="entry.path"
                            :to="`/docs${entry.path}`"
                            class="flex flex-col gap-1 rounded-lg border border-default bg-default p-4 hover:bg-elevated/50 transition-colors"
                        >
                            <UIcon
                                :name="entry.icon"
                                class="size-4 text-primary"
                            />
                            <span class="text-sm font-medium">{{ entry.label }}</span>
                            <span class="text-xs text-dimmed">{{ entry.hint }}</span>
                        </NuxtLink>
                    </div>

                    <UAlert
                        v-if="broken.length > 0"
                        color="warning"
                        variant="subtle"
                        icon="i-lucide-link-2-off"
                        title="Broken relative links"
                        :description="`${snapshot?.docs?.brokenLinkCount} link${snapshot?.docs?.brokenLinkCount === 1 ? '' : 's'} across ${broken.length} file${broken.length === 1 ? '' : 's'} resolve to nothing on disk.`"
                    >
                        <template #description>
                            <div class="flex flex-col gap-1 mt-1">
                                <NuxtLink
                                    v-for="page in broken"
                                    :key="page.path"
                                    :to="`/docs${toCollectionPath(page.path)}`"
                                    class="text-xs font-mono hover:underline truncate"
                                >
                                    {{ page.path }} → {{ page.brokenLinks.map((link) => link.href).join(", ") }}
                                </NuxtLink>
                            </div>
                        </template>
                    </UAlert>

                    <!--
                        The tree itself — every section, group and entry — is the sidebar's job, and
                        it sits right next to this on every screen wide enough to show it. Repeating
                        it here as a card grid was a second nav, not a second kind of information: it
                        went stale the same moment the sidebar did, just less legibly. This card is
                        the one thing the sidebar doesn't say — what changed recently — so it earns
                        its place instead of duplicating one.
                    -->
                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <template #header>
                            <h2 class="font-semibold">
                                Recently changed
                            </h2>
                            <p class="text-xs text-muted mt-1">
                                From the last commit that touched each file, not from a page view.
                            </p>
                        </template>

                        <div
                            v-if="recent.length === 0"
                            class="p-8 text-center text-sm text-muted"
                        >
                            Nothing collected yet — run <code class="font-mono">pnpm tech-docs:collect</code>.
                        </div>

                        <div
                            v-else
                            class="divide-y divide-default"
                        >
                            <NuxtLink
                                v-for="page in recent"
                                :key="page.path"
                                :to="`/docs${toCollectionPath(page.path)}`"
                                class="flex items-center gap-3 px-4 py-2 hover:bg-elevated/40 transition-colors"
                            >
                                <UIcon
                                    :name="kindIcon(page.kind)"
                                    class="size-3.5 text-dimmed shrink-0"
                                />
                                <span class="text-xs font-mono truncate flex-1">{{ page.path }}</span>
                                <span class="text-[11px] text-dimmed shrink-0">{{ relativeTime(page.updatedAt) }}</span>
                            </NuxtLink>
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
