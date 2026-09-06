<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { data: issues } = useIssues();
const { data: reviews } = await useReviewPages();
const { public: { repoUrl } } = useRuntimeConfig();

const open = computed(() => issues.value.issues.length);

const links = computed<NavigationMenuItem[][]>(() => [
    [
        { label: "Overview", icon: "i-lucide-layout-dashboard", to: "/" },
        { label: "Wiki", icon: "i-lucide-library", to: "/docs" },
        {
            label: "Reviews",
            icon: "i-lucide-clipboard-check",
            to: "/reviews",
            badge: reviews.value.length === 0 ? undefined : String(reviews.value.length),
        },
        { label: "Changelog", icon: "i-lucide-tag", to: "/changelog" },
    ],
    [
        { label: "Scorecards", icon: "i-lucide-target", to: "/scorecards" },
        { label: "Coverage", icon: "i-lucide-shield-check", to: "/coverage" },
        { label: "Graph", icon: "i-lucide-git-fork", to: "/graph" },
        {
            label: "Issues",
            icon: "i-lucide-circle-dot",
            to: "/issues",
            badge: open.value === 0 ? undefined : String(open.value),
        },
    ],
]);

// Fed straight from the content collection, so ⌘K searches every README, CLAUDE.md, changelog,
// skill and doc in the workspace without a second index to keep in step.
const { data: sections } = await useAsyncData("search-sections", () =>
    queryCollectionSearchSections("docs"), { default: () => [] });

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
                    >Repo dashboard</span>
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UDashboardSearchButton
                    :collapsed="collapsed"
                    class="bg-transparent ring-default"
                />

                <UNavigationMenu
                    v-for="(group, index) in links"
                    :key="index"
                    :items="group"
                    :collapsed="collapsed"
                    orientation="vertical"
                />
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
            :groups="searchGroups"
            placeholder="Search the workspace docs…"
        />

        <slot />
    </UDashboardGroup>
</template>
