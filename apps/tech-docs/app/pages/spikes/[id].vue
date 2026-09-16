<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import { sortSpikes } from "#shared/spikeReports.ts";

const route = useRoute();

const reports = useSpikeReports();

const id = computed(() => (route.params.id as string | undefined) ?? "");
const path = computed(() => `/docs/spikes/${id.value}`);

const { data: page } = await useAsyncData(
    () => `spike-${id.value}`,
    () => queryCollection("docs").path(path.value).first(),
    { watch: [path] },
);

const report = computed(() => reports.value.find((candidate) => candidate.id === id.value) ?? null);

const crumbs = computed<BreadcrumbItem[]>(() => [
    { label: "Spikes", to: "/spikes", icon: "i-lucide-compass" },
    { label: report.value?.number ?? id.value, class: "font-mono" },
]);

/** Neighbours by number — the order the decisions were made, which one report reading on from another follows regardless of how the list was last sorted. */
const around = computed(() => {
    const ordered = sortSpikes(reports.value, "oldest");
    const index = ordered.findIndex((candidate) => candidate.id === id.value);

    return { previous: index > 0 ? ordered[index - 1] : null, next: index === -1 ? null : ordered[index + 1] ?? null };
});
</script>

<template>
    <UDashboardPanel id="spike">
        <template #header>
            <UDashboardNavbar :title="report?.title ?? page?.title ?? 'Not found'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <StatusPill
                        v-if="report?.decision === 'superseded' && report.supersededBy"
                        :label="spikeDecisionLabel(report.decision)"
                        tone="bad"
                        :to="`/spikes/${report.supersededBy.replace(/\.md$/, '')}`"
                        :hint="`Superseded by ${report.supersededBy}`"
                    />
                    <StatusPill
                        v-if="report?.status"
                        :label="spikeStatusLabel(report.status)"
                        :tone="spikeStatusTone(report.status)"
                    />
                    <span
                        v-if="report"
                        class="text-xs text-muted"
                    >{{ report.words }} words · updated {{ relativeTime(report.updatedAt) }}</span>
                    <code class="text-xs text-dimmed font-mono">{{ report?.path ?? `${path.slice(1)}.md` }}</code>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex gap-6 items-start">
                <div class="flex-1 min-w-0 flex flex-col gap-4">
                    <UBreadcrumb :items="crumbs" />

                    <UAlert
                        v-if="!page"
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-file-question"
                        title="No such report"
                        :description="`Nothing under docs/spikes/ matches ${id}. Reports are numbered consecutively, so a gap is a report that was never filed.`"
                    />

                    <template v-else>
                        <UPageBody class="mt-0">
                            <ContentRenderer :value="page" />
                        </UPageBody>

                        <USeparator class="my-4" />

                        <div class="grid sm:grid-cols-2 gap-3">
                            <NuxtLink
                                v-if="around.previous"
                                :to="`/spikes/${around.previous.id}`"
                                class="flex items-center gap-2 rounded-lg border border-default p-3 hover:bg-elevated/40 transition-colors"
                            >
                                <UIcon
                                    name="i-lucide-arrow-left"
                                    class="size-4 text-dimmed"
                                />
                                <div class="min-w-0">
                                    <div class="text-[11px] text-dimmed">
                                        Decided before
                                    </div>
                                    <div class="text-sm truncate">
                                        {{ around.previous.title }}
                                    </div>
                                </div>
                            </NuxtLink>

                            <NuxtLink
                                v-if="around.next"
                                :to="`/spikes/${around.next.id}`"
                                class="flex items-center justify-end gap-2 rounded-lg border border-default p-3 hover:bg-elevated/40 transition-colors sm:col-start-2"
                            >
                                <div class="min-w-0 text-right">
                                    <div class="text-[11px] text-dimmed">
                                        Decided after
                                    </div>
                                    <div class="text-sm truncate">
                                        {{ around.next.title }}
                                    </div>
                                </div>
                                <UIcon
                                    name="i-lucide-arrow-right"
                                    class="size-4 text-dimmed"
                                />
                            </NuxtLink>
                        </div>
                    </template>
                </div>

                <aside
                    v-if="page?.body?.toc?.links?.length"
                    class="hidden xl:block w-56 shrink-0 sticky top-0"
                >
                    <UContentToc
                        :links="page.body.toc.links"
                        highlight
                        class="bg-transparent"
                    />
                </aside>
            </div>
        </template>
    </UDashboardPanel>
</template>
