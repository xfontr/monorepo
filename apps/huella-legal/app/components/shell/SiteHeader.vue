<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { RouteMap } from "vue-router";

interface Nav {
    key: string
    to: {
        name: keyof RouteMap
    }
}

const NAV = [
    { key: "publications", to: { name: "publications" } },
    { key: "subjects", to: { name: "categories" } },
    { key: "collaborators", to: { name: "authors" } },
    { key: "publish", to: { name: "publish" } },
] as const satisfies readonly Nav[];

const NEWSLETTER = { name: "index", hash: "#newsletter" } as const;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { journal } = useAppConfig();

const open = ref<boolean>(false);

const items = computed<NavigationMenuItem[]>(() => NAV.map(({ key, to }) => {
    const { path } = router.resolve(to);
    const current = route.path === path ? "page" : route.path.startsWith(path) ? "true" : undefined;

    return {
        "label": t(`app.header.nav.${key}`),
        to,
        "active": !!current,
        "aria-current": current };
}));
</script>

<template>
    <UHeader
        v-model:open="open"
        :to="router.resolve({ name: 'index' }).path"
        mode="slideover"
        :title="$t('app.header.home')"
        :menu="{ title: $t('app.header.menu.title'), description: $t('app.header.menu.description') }"
    >
        <template #top>
            <div class="hidden border-b border-(--ui-border-muted) md:block">
                <UContainer class="flex h-9 items-center justify-between font-sans text-xs text-muted">
                    <span>{{ $t("app.header.strip", { issn: journal.issn }) }}</span>
                    <ULink
                        :to="NEWSLETTER"
                        raw
                        class="relative inline-flex h-9 items-center gap-1.5 font-semibold text-primary after:absolute after:inset-x-0 after:top-0 after:-bottom-2 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        <UIcon
                            name="i-lucide-mail"
                            class="size-3.5"
                        />
                        {{ $t("app.header.newsletter") }}
                    </ULink>
                </UContainer>
            </div>
        </template>

        <template #title>
            <BaseWordmark />
        </template>

        <UNavigationMenu
            :items
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
                :to="NEWSLETTER"
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
                    :items
                    orientation="vertical"
                    variant="link"
                    color="primary"
                    :aria-label="$t('app.header.nav.label')"
                >
                    <template #item-trailing>
                        <UIcon
                            name="i-lucide-chevron-right"
                            class="size-5 text-dimmed"
                        />
                    </template>
                </UNavigationMenu>

                <div class="flex flex-col gap-3 p-4">
                    <UButton
                        block
                        :to="NEWSLETTER"
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
                        {{ $t("app.header.strip", { issn: journal.issn }) }}
                    </p>
                </div>
            </div>
        </template>
    </UHeader>
</template>
