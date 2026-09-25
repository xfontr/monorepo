<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import { FINDING_STATUSES } from "#shared/audits.ts";

const route = useRoute();

const reports = useAuditReports();

const id = computed(() => (route.params.id as string | undefined) ?? "");
const path = computed(() => `/docs/audits/${id.value}`);

const { data: page } = await useAsyncData(
    () => `audit-${id.value}`,
    () => queryCollection("docs").path(path.value).first(),
    { watch: [path] },
);

const report = computed(() => reports.value.find((candidate) => candidate.id === id.value) ?? null);

const crumbs = computed<BreadcrumbItem[]>(() => [
    { label: "Audits", to: "/audits", icon: "i-lucide-scan-search" },
    { label: report.value?.date ?? id.value, class: "font-mono" },
]);
</script>

<template>
    <UDashboardPanel id="audit">
        <template #header>
            <UDashboardNavbar :title="report?.title ?? page?.title ?? 'Not found'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <StatusPill
                        v-if="report"
                        :label="auditStateLabel(report.state)"
                        :tone="auditStateTone(report.state)"
                    />
                    <span
                        v-if="report?.commit"
                        class="text-xs text-muted"
                    >read at <code class="font-mono">{{ report.commit }}</code></span>
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
                        title="No such audit"
                        :description="`Nothing under docs/audits/ matches ${id}.`"
                    />

                    <template v-else>
                        <div
                            v-if="report"
                            class="grid grid-cols-3 gap-3"
                        >
                            <StatTile
                                v-for="status in FINDING_STATUSES"
                                :key="status"
                                :label="findingStatusLabel(status)"
                                :value="report.counts[status]"
                                :tone="findingStatusTone(status)"
                            />
                        </div>

                        <UPageBody class="mt-0">
                            <ContentRenderer :value="page" />
                        </UPageBody>
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
