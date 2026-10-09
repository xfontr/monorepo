<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { DESTINATIONS } from "~/composables/useSiteNav";

interface Props {
    sections: NavigationMenuItem[];
    issn: string;
}

defineProps<Props>();

const router = useRouter();
const homePath = computed(() => router.resolve({ name: "index" }).path);
</script>

<template>
    <UHeader
        :to="homePath"
        mode="slideover"
        :title="$t('app.header.home')"
        :menu="{
            title: $t('app.header.menu.title'),
            description: $t('app.header.menu.description'),
        }"
    >
        <template #top>
            <div class="hidden border-b border-(--ui-border-muted) md:block">
                <UContainer
                    class="flex h-9 items-center justify-between font-sans text-xs text-muted"
                >
                    <span>{{ $t("app.header.strip", { issn }) }}</span>
                    <ULink
                        :to="DESTINATIONS.newsletter"
                        raw
                        class="relative inline-flex h-9 items-center gap-1.5 font-semibold text-primary after:absolute after:inset-x-0 after:top-0 after:-bottom-2 hover:underline focus-visible:rounded-xs"
                    >
                        <UIcon name="i-lucide-mail" class="size-3.5" />
                        {{ $t("app.header.newsletter") }}
                    </ULink>
                </UContainer>
            </div>
        </template>

        <template #title>
            <BaseWordmark />
        </template>

        <UNavigationMenu
            :items="sections"
            variant="link"
            color="neutral"
            highlight
            highlight-color="primary"
            :aria-label="$t('app.header.nav.label')"
        />

        <template #right>
            <UButton
                :to="{ name: 'search' }"
                square
                variant="ghost"
                color="neutral"
                icon="i-lucide-search"
                :aria-label="$t('app.header.search')"
            />
            <UButton
                :to="DESTINATIONS.newsletter"
                :label="$t('app.header.subscribe')"
                class="hidden md:inline-flex"
            />
        </template>

        <template #content="{ close }">
            <div class="flex min-h-16 shrink-0 items-center border-b border-default px-4">
                <BaseWordmark size="sm" />
                <UButton
                    square
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-x"
                    :aria-label="$t('app.header.menu.close')"
                    class="ml-auto"
                    @click="close"
                />
            </div>

            <div class="overflow-y-auto">
                <UNavigationMenu
                    :items="sections"
                    orientation="vertical"
                    variant="link"
                    color="primary"
                    :aria-label="$t('app.header.nav.label')"
                >
                    <template #item-trailing>
                        <UIcon name="i-lucide-chevron-right" class="size-5 text-dimmed" />
                    </template>
                </UNavigationMenu>

                <div class="flex flex-col gap-3 p-4">
                    <UButton
                        block
                        :to="DESTINATIONS.newsletter"
                        :label="$t('app.header.menu.subscribe')"
                    />
                    <UButton
                        block
                        variant="outline"
                        color="neutral"
                        :to="{ name: 'publish' }"
                        :label="$t('app.header.menu.publish')"
                    />
                    <p class="pt-2 font-sans text-xs text-muted">
                        {{ $t("app.header.strip", { issn }) }}
                    </p>
                </div>
            </div>
        </template>
    </UHeader>
</template>
