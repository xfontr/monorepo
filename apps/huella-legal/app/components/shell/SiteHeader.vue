<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useMediaQuery } from "@vueuse/core";

interface Props {
    sections: NavigationMenuItem[];
    issn: string;
}

const props = defineProps<Props>();

const WIDE = "(min-width: 64rem)";

const router = useRouter();
const route = useRoute();
const jumpToNewsletter = useNewsletterJump();
const { nav } = useAppConfig();

const jumpFromMenu = (event: MouseEvent, close?: () => void): void => {
    close?.();
    jumpToNewsletter(event);
};

const homePath = computed(() => router.resolve({ name: "index" }).path);

const menuSections = computed<NavigationMenuItem[]>(() =>
    props.sections.map((section) =>
        section.children ? { ...section, type: "trigger" as const } : section,
    ),
);

const wide = useMediaQuery(WIDE);
const inlineSections = shallowRef<NavigationMenuItem[]>(props.sections);

watchEffect(() => {
    if (wide.value) inlineSections.value = props.sections;
});

const openSection = ref<string>("");

watch(
    () => route.fullPath,
    () => {
        openSection.value = "";
    },
);
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
                        :to="nav.newsletter"
                        raw
                        @click="jumpToNewsletter"
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

        <LazyUNavigationMenu
            v-model="openSection"
            :hydrate-on-media-query="WIDE"
            :items="inlineSections"
            content-orientation="vertical"
            variant="link"
            color="neutral"
            highlight
            highlight-color="primary"
            :aria-label="$t('app.header.nav.label')"
        >
            <template #publications-content>
                <LazyNavPublicationsPanel />
            </template>
            <template #subjects-content>
                <LazyNavSubjectsPanel />
            </template>
        </LazyUNavigationMenu>

        <template #right>
            <SearchDialog />
            <UButton
                :to="nav.newsletter"
                :label="$t('app.header.subscribe')"
                @click="jumpToNewsletter"
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
                <LazyUNavigationMenu
                    :items="menuSections"
                    orientation="vertical"
                    variant="link"
                    color="primary"
                    :aria-label="$t('app.header.nav.label')"
                >
                    <template #item-trailing="{ item }">
                        <UIcon
                            v-if="item.children"
                            name="i-lucide-chevron-down"
                            class="size-5 text-dimmed transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                        />
                    </template>
                </LazyUNavigationMenu>

                <div class="flex flex-col gap-3 p-4">
                    <UButton
                        block
                        :to="nav.newsletter"
                        :label="$t('app.header.menu.subscribe')"
                        @click="jumpFromMenu($event, close)"
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
