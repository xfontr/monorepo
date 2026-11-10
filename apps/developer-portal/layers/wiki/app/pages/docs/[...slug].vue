<template>
    <UDashboardPanel id="doc">
        <template #header>
            <UDashboardNavbar :title="here?.entry.label ?? page?.title ?? 'Not found'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span v-if="meta" class="text-xs text-muted"
                        >{{ meta.words }} words · updated {{ updated }}</span
                    >
                    <code class="font-mono text-xs text-dimmed">{{ source }}</code>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex items-start gap-6">
                <aside class="sticky top-0 hidden w-60 shrink-0 lg:block">
                    <WikiNav :sections :current="path" />
                </aside>

                <div class="flex min-w-0 flex-1 flex-col gap-4">
                    <UBreadcrumb :items="crumbs" />

                    <UAlert
                        v-if="!page"
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-file-question"
                        title="No such page"
                        :description="`Nothing in the workspace matches ${path}. The wiki links only to files that exist, so this is a hand-typed or stale URL.`"
                    />

                    <template v-else>
                        <UAlert
                            v-if="brokenLinks"
                            color="warning"
                            variant="subtle"
                            icon="i-lucide-link-2-off"
                            title="This page links to something that is not there"
                            :description="brokenLinks"
                            :ui="{ description: 'text-xs font-mono' }"
                        />

                        <UPageBody class="mt-0">
                            <ContentRenderer :value="page" />
                        </UPageBody>

                        <USeparator class="my-4" />

                        <div class="grid gap-3 sm:grid-cols-2">
                            <NuxtLink
                                v-if="around.previous"
                                :to="`/docs${around.previous.path}`"
                                class="flex items-center gap-2 rounded-lg border border-default p-3 transition-colors hover:bg-elevated/50"
                            >
                                <UIcon name="i-lucide-arrow-left" class="size-4 text-dimmed" />
                                <div class="min-w-0">
                                    <div class="text-2xs text-dimmed">
                                        Previous in {{ here?.group.label }}
                                    </div>
                                    <div class="truncate text-sm">
                                        {{ around.previous.label }}
                                    </div>
                                </div>
                            </NuxtLink>

                            <NuxtLink
                                v-if="around.next"
                                :to="`/docs${around.next.path}`"
                                class="flex items-center justify-end gap-2 rounded-lg border border-default p-3 transition-colors hover:bg-elevated/50 sm:col-start-2"
                            >
                                <div class="min-w-0 text-right">
                                    <div class="text-2xs text-dimmed">
                                        Next in {{ here?.group.label }}
                                    </div>
                                    <div class="truncate text-sm">
                                        {{ around.next.label }}
                                    </div>
                                </div>
                                <UIcon name="i-lucide-arrow-right" class="size-4 text-dimmed" />
                            </NuxtLink>
                        </div>
                    </template>
                </div>

                <aside
                    v-if="page?.body?.toc?.links?.length"
                    class="sticky top-0 hidden w-56 shrink-0 xl:block"
                >
                    <UContentToc :links="page.body.toc.links" highlight class="bg-transparent" />
                </aside>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import { toCollectionPath } from "#layers/docs/shared/docPages.ts";
import { locate } from "#layers/wiki/shared/wiki.ts";

const route = useRoute();

const { data: snapshot } = await useSnapshot("docs");
const { data: sections } = await useWiki();

const path = computed(() =>
    `/${((route.params.slug as string[] | undefined) ?? []).join("/")}`.toLowerCase(),
);

const { data: page } = await useAsyncData(
    () => `doc-${path.value}`,
    () => queryCollection("docs").path(path.value).first(),
    { watch: [path] },
);

const here = computed(() => locate(sections.value, path.value));

const crumbs = computed<BreadcrumbItem[]>(() => [
    { label: "Wiki", to: "/docs", icon: "i-lucide-library" },
    ...(here.value
        ? [
              { label: here.value.section.label, icon: here.value.section.icon },
              { label: here.value.group.label, class: "font-mono" },
              { label: here.value.entry.label },
          ]
        : []),
]);

/**
 * Neighbours within the group rather than the collection's alphabetical order: `packages/i18n`'s
 * README and `packages/observability`'s CLAUDE.md are adjacent on disk and unrelated to read.
 */
const around = computed(() => {
    const entries = here.value?.group.entries ?? [];
    const index = entries.findIndex((entry) => entry.path === path.value);

    return {
        previous: index > 0 ? entries[index - 1] : null,
        next: index === -1 ? null : (entries[index + 1] ?? null),
    };
});

const meta = computed(
    () =>
        snapshot.value?.docs?.pages.find((doc) => toCollectionPath(doc.path) === path.value) ??
        null,
);
const updated = computed(() => relativeTime(meta.value?.updatedAt));
const source = computed(() => meta.value?.path ?? `${path.value.slice(1)}.md`);
const brokenLinks = computed(
    () => meta.value?.brokenLinks.map((link) => link.href).join(", ") ?? "",
);
</script>
