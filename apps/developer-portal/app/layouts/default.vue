<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { data: issues } = useIssues();
const { data: reviews } = await useReviewPages();
const { data: badges } = await useFetch<{ advisories: number }>("/api/badges", { key: "badges" });
const { public: { repoUrl } } = useRuntimeConfig();

const open = computed(() => issues.value.issues.length);
const advisories = computed(() => badges.value?.advisories ?? 0);

const navGroups = computed<{ label: string, items: NavigationMenuItem[] }[]>(() => [
    {
        label: "Explore",
        items: [
            { label: "Overview", icon: "i-lucide-layout-dashboard", to: "/" },
            { label: "Projects", icon: "i-lucide-boxes", to: "/projects" },
            { label: "What's new", icon: "i-lucide-tag", to: "/changelog" },
        ],
    },
    {
        label: "Build",
        items: [
            { label: "Documentation", icon: "i-lucide-library", to: "/docs" },
            { label: "Architecture", icon: "i-lucide-git-fork", to: "/graph" },
            { label: "Decisions", icon: "i-lucide-compass", to: "/decisions" },
        ],
    },
    {
        label: "Engineering health",
        items: [
            {
                label: "Work in progress",
                icon: "i-lucide-circle-dot",
                to: "/issues",
                badge: open.value === 0 ? undefined : String(open.value),
            },
            { label: "Coverage", icon: "i-lucide-shield-check", to: "/coverage" },
            {
                label: "Dependencies",
                icon: "i-lucide-shield-alert",
                to: "/deps",
                badge: advisories.value === 0 ? undefined : String(advisories.value),
            },
            {
                label: "Reviews",
                icon: "i-lucide-clipboard-check",
                to: "/reviews",
                badge: reviews.value.length === 0 ? undefined : String(reviews.value.length),
            },
            { label: "Scorecards", icon: "i-lucide-target", to: "/scorecards" },
        ],
    },
]);

const searchOpen = ref(false);

// Deferred to the first open; built here it rides in every prerendered payload (../../README.md).
const { data: sections, status, execute } = useAsyncData("search-sections", () =>
    queryCollectionSearchSections("docs"), { default: () => [], immediate: false, server: false });

watch(searchOpen, () => {
    if (searchOpen.value && status.value === "idle") execute();
});

const searchGroups = computed(() => [{
    id: "docs",
    label: "Wiki",
    items: sections.value.map((section) => ({
        label: section.title,
        suffix: section.content,
        to: `/docs${section.id.replace(/^\//, "/")}`,
        icon: "i-lucide-file-text",
    })),
}]);
</script>

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
                <NuxtLink
                    to="/"
                    class="flex items-center gap-2 min-w-0"
                >
                    <UIcon
                        name="i-lucide-activity"
                        class="size-5 shrink-0 text-primary"
                    />
                    <span
                        v-if="!collapsed"
                        class="font-semibold truncate"
                    >Monorepo</span>
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UDashboardSearchButton
                    :collapsed="collapsed"
                    class="bg-transparent ring-default"
                />

                <div
                    v-for="group in navGroups"
                    :key="group.label"
                    class="flex flex-col gap-1"
                >
                    <p
                        v-if="!collapsed"
                        class="px-2 pt-3 text-xs font-semibold text-dimmed"
                    >
                        {{ group.label }}
                    </p>
                    <UNavigationMenu
                        :items="group.items"
                        :collapsed="collapsed"
                        orientation="vertical"
                    />
                </div>
            </template>

            <template #footer="{ collapsed }">
                <div class="flex items-center gap-1.5 w-full">
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
