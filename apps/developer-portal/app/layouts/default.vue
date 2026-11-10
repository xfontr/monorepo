<template>
    <UDashboardGroup unit="rem">
        <UDashboardSidebar
            id="dashboard"
            resizable
            collapsible
            :default-size="15"
            :min-size="12"
            :max-size="22"
        >
            <template #header="{ collapsed }">
                <NuxtLink to="/" class="flex min-w-0 items-center gap-2">
                    <UIcon name="i-lucide-activity" class="size-5 shrink-0 text-primary" />
                    <span v-if="!collapsed" class="truncate font-semibold">Monorepo</span>
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UDashboardSearchButton :collapsed class="bg-transparent ring-default" />

                <div v-for="group in navGroups" :key="group.label" class="flex flex-col gap-1">
                    <p v-if="!collapsed" class="px-2 pt-3 text-xs font-semibold text-dimmed">
                        {{ group.label }}
                    </p>
                    <UNavigationMenu :items="group.items" :collapsed orientation="vertical" />
                </div>
            </template>

            <template #footer="{ collapsed }">
                <div class="flex w-full items-center gap-1.5">
                    <UColorModeButton
                        :block="!collapsed"
                        :label="collapsed ? undefined : 'Theme'"
                        class="flex-1"
                    />

                    <UButton
                        v-if="!collapsed"
                        :to="repoUrl"
                        target="_blank"
                        icon="i-simple-icons-github"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        square
                        aria-label="View source on GitHub"
                    />
                </div>
            </template>
        </UDashboardSidebar>

        <UDashboardSearch
            v-model:open="searchOpen"
            :groups="searchGroups"
            :loading="status === 'pending'"
            placeholder="Search the workspace docs…"
        />

        <slot />
    </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { data: issues } = useIssues();
const { data: badges } = await useFetch<{ advisories: number }>("/api/badges", { key: "badges" });
const {
    public: { repoUrl },
} = useRuntimeConfig();

const open = computed(() => issues.value.issues.length);
const advisories = computed(() => badges.value?.advisories ?? 0);

interface NavLink {
    label: string;
    icon: string;
    to: string;
}

/** A key no layer declares is skipped, so removing a layer drops its entry. */
const GROUPS = [
    { label: "Explore", items: ["overview", "projects", "changelog"] },
    { label: "Build", items: ["docs", "graph", "decisions", "audits", "workflows"] },
    {
        label: "Engineering health",
        items: ["issues", "coverage", "telemetry", "deps"],
    },
];

const { nav }: { nav: Record<string, NavLink | undefined> } = useAppConfig();

const counts = computed<Record<string, number>>(() => ({
    issues: open.value,
    deps: advisories.value,
}));

const navGroups = computed<{ label: string; items: NavigationMenuItem[] }[]>(() =>
    GROUPS.map(({ label, items }) => ({
        label,
        items: items.flatMap((key) => {
            const link = nav[key];
            const count = counts.value[key] ?? 0;

            return link ? [{ ...link, badge: count === 0 ? undefined : String(count) }] : [];
        }),
    })),
);

const searchOpen = ref(false);

// Deferred to the first open; built here it rides in every prerendered payload (../../README.md).
const {
    data: sections,
    status,
    execute,
} = useAsyncData("search-sections", () => queryCollectionSearchSections("docs"), {
    default: () => [],
    immediate: false,
    server: false,
});

watch(searchOpen, () => {
    if (searchOpen.value && status.value === "idle") execute();
});

const searchGroups = computed(() => [
    {
        id: "docs",
        label: "Wiki",
        items: sections.value.map((section) => ({
            label: section.title,
            suffix: section.content,
            to: `/docs${section.id}`,
            icon: "i-lucide-file-text",
        })),
    },
]);
</script>
