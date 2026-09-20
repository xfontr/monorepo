<script setup lang="ts">
import { toCollectionPath } from "#shared/wiki.ts";

const { data: snapshot } = await useSnapshot("docs");
const { data: sections } = await useWiki();

const pages = computed(() => snapshot.value?.docs?.pages ?? []);

const count = computed(() => sections.value.reduce(
    (sum, section) => sum + section.groups.reduce((inner, group) => inner + group.entries.length, 0),
    0,
));

const START_GROUPS = [
    {
        label: "Explore",
        items: [
            { to: "/docs/readme", label: "Repository overview", hint: "What this monorepo contains", icon: "i-lucide-map" },
            { to: "/projects", label: "Project catalog", hint: "Applications, packages, and tooling", icon: "i-lucide-boxes" },
        ],
    },
    {
        label: "Understand",
        items: [
            { to: "/docs/docs/concepts/boundaries", label: "Architecture and boundaries", hint: "How projects are allowed to depend", icon: "i-lucide-git-branch" },
            { to: "/graph", label: "Architecture view", hint: "How the collected projects fit together", icon: "i-lucide-git-fork" },
        ],
    },
    {
        label: "Contribute",
        items: [
            { to: "/docs/docs/guides/first-hour", label: "First hour", hint: "An ordered way into the repository", icon: "i-lucide-play" },
        ],
    },
];

const known = computed(() => new Set(sections.value.flatMap((section) =>
    section.groups.flatMap((group) => group.entries.map((entry) => entry.path)))));

const startGroups = computed(() => START_GROUPS
    .map((group) => ({
        ...group,
        items: group.items.filter((entry) => !entry.to.startsWith("/docs/") || known.value.has(entry.to.slice("/docs".length))),
    }))
    .filter((group) => group.items.length > 0));

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
                    <WikiNav :sections="sections" />
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

                    <div class="flex flex-col gap-5">
                        <section
                            v-for="group in startGroups"
                            :key="group.label"
                            class="flex flex-col gap-2"
                        >
                            <h2 class="text-sm font-semibold">
{{ group.label }}
</h2>
                            <div class="grid sm:grid-cols-2 gap-3">
                                <NuxtLink
                                    v-for="entry in group.items"
                                    :key="entry.to"
                                    :to="entry.to"
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
                        </section>
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
                        The sidebar already shows every section, group and entry; repeating that here
                        would just be a second nav that drifts. This card exists for the one thing the
                        sidebar doesn't say — what changed recently.
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
                            Nothing collected yet — run <code class="font-mono">pnpm exec nx collect @monorepo/developer-portal</code>.
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
