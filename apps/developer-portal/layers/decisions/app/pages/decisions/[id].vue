<template>
    <UDashboardPanel id="decision">
        <template #header>
            <UDashboardNavbar :title="report?.title ?? page?.title ?? 'Not found'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <StatusPill
                        v-if="supersession"
                        :label="supersession.label"
                        tone="bad"
                        :to="supersession.to"
                        :hint="supersession.hint"
                    />
                    <StatusPill
                        v-if="statusPill"
                        :label="statusPill.label"
                        :tone="statusPill.tone"
                    />
                    <span v-if="report" class="text-xs text-muted"
                        >{{ report.words }} words · updated {{ updated }}</span
                    >
                    <code class="font-mono text-xs text-dimmed">{{ source }}</code>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex items-start gap-6">
                <div class="flex min-w-0 flex-1 flex-col gap-4">
                    <UBreadcrumb :items="crumbs" />

                    <UAlert
                        v-if="!page"
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-file-question"
                        title="No such report"
                        :description="`Nothing under docs/decisions/ matches ${id}. Reports are numbered consecutively, so a gap is a report that was never filed.`"
                    />

                    <template v-else>
                        <UPageBody class="mt-0">
                            <ContentRenderer :value="page" />
                        </UPageBody>

                        <USeparator class="my-4" />

                        <div class="grid gap-3 sm:grid-cols-2">
                            <NuxtLink
                                v-if="around.previous"
                                :to="`/decisions/${around.previous.id}`"
                                class="flex items-center gap-2 rounded-lg border border-default p-3 transition-colors hover:bg-elevated/50"
                            >
                                <UIcon name="i-lucide-arrow-left" class="size-4 text-dimmed" />
                                <div class="min-w-0">
                                    <div class="text-2xs text-dimmed">Decided before</div>
                                    <div class="truncate text-sm">
                                        {{ around.previous.title }}
                                    </div>
                                </div>
                            </NuxtLink>

                            <NuxtLink
                                v-if="around.next"
                                :to="`/decisions/${around.next.id}`"
                                class="flex items-center justify-end gap-2 rounded-lg border border-default p-3 transition-colors hover:bg-elevated/50 sm:col-start-2"
                            >
                                <div class="min-w-0 text-right">
                                    <div class="text-2xs text-dimmed">Decided after</div>
                                    <div class="truncate text-sm">
                                        {{ around.next.title }}
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
import { sortDecisions } from "#layers/decisions/shared/decisionReports.ts";

const route = useRoute();

const reports = useDecisionReports();

const id = computed(() => (route.params.id as string | undefined) ?? "");
const path = computed(() => `/docs/decisions/${id.value}`);

const { data: page } = await useAsyncData(
    () => `decision-${id.value}`,
    () => queryCollection("docs").path(path.value).first(),
    { watch: [path] },
);

const report = computed(() => reports.value.find((candidate) => candidate.id === id.value) ?? null);

const supersession = computed(() => {
    const by = report.value?.decision === "superseded" ? report.value.supersededBy : null;

    return by
        ? {
              label: decisionOutcomeLabel("superseded"),
              to: `/decisions/${by.replace(/\.md$/, "")}`,
              hint: `Superseded by ${by}`,
          }
        : null;
});

const statusPill = computed(
    () =>
        report.value?.status && {
            label: decisionStatusLabel(report.value.status),
            tone: decisionStatusTone(report.value.status),
        },
);

const updated = computed(() => relativeTime(report.value?.updatedAt));
const source = computed(() => report.value?.path ?? `${path.value.slice(1)}.md`);

const crumbs = computed<BreadcrumbItem[]>(() => [
    { label: "Decisions", to: "/decisions", icon: "i-lucide-compass" },
    { label: report.value?.number ?? id.value, class: "font-mono" },
]);

/** Neighbours by number — the order the decisions were made, which one report reading on from another follows regardless of how the list was last sorted. */
const around = computed(() => {
    const ordered = sortDecisions(reports.value, "oldest");
    const index = ordered.findIndex((candidate) => candidate.id === id.value);

    return {
        previous: index > 0 ? ordered[index - 1] : null,
        next: index === -1 ? null : (ordered[index + 1] ?? null),
    };
});
</script>
