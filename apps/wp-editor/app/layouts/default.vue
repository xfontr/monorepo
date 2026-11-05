<template>
    <UDashboardGroup unit="rem">
        <UDashboardSidebar id="nav" collapsible :default-size="13" :min-size="11" :max-size="18">
            <template #header="{ collapsed }">
                <NuxtLink to="/" class="flex min-w-0 items-center gap-2">
                    <UIcon name="i-lucide-file-diff" class="size-5 shrink-0 text-primary" />
                    <span v-if="!collapsed" class="truncate font-semibold">WP Editor</span>
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UNavigationMenu :items :collapsed orientation="vertical" />
            </template>

            <template #footer="{ collapsed }">
                <UColorModeButton :block="!collapsed" :label="collapsed ? undefined : 'Theme'" />
            </template>
        </UDashboardSidebar>

        <slot />
    </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items: NavigationMenuItem[] = [
    { label: "Changesets", icon: "i-lucide-layers", to: "/" },
    { label: "Settings", icon: "i-lucide-settings-2", to: "/settings" },
];
</script>
