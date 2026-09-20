<script setup lang="ts">
import { filterIssues, labelsOf, sortIssues } from "#shared/issues.ts";

// Not awaited: `await` resolves to the plain `useFetch` state and would drop `reload` with it.
// Nuxt settles the request before it serialises the payload either way.
const { data: issues, reload } = useIssues();

const label = ref<string>("all");
const search = ref("");

const all = computed(() => issues.value.issues);

const visible = computed(() => sortIssues(filterIssues(all.value, {
    label: label.value,
    search: search.value,
})));

const labelItems = computed(() => [
    { label: "Every label", value: "all" },
    ...labelsOf(all.value).map((name) => ({ label: name, value: name })),
]);

const reloading = ref(false);

async function refresh(): Promise<void> {
    reloading.value = true;
    await reload();
    reloading.value = false;
}
</script>

<template>
    <UDashboardPanel id="issues">
        <template #header>
            <UDashboardNavbar title="Work in progress">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="text-xs text-muted">
                        {{ issues.fetchedAt ? `read ${relativeTime(issues.fetchedAt)}` : "not read yet" }}
                    </span>
                    <UButton
                        icon="i-lucide-refresh-cw"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        :loading="reloading"
                        aria-label="Re-read the issues from GitHub"
                        @click="refresh"
                    />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search issues…"
                        size="sm"
                        class="w-56"
                    />
                </template>
                <template #right>
                    <USelect
                        v-model="label"
                        :items="labelItems"
                        value-key="value"
                        size="sm"
                        class="w-40"
                    />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <p class="text-sm text-muted max-w-3xl">
                    Planned and active repository work appears here as issues from GitHub. The issue read is live in
                    your browser; the rest of this portal remains a collected snapshot.
                </p>

                <UAlert
                    v-if="issues.error"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-plug-zap"
                    title="GitHub could not be reached"
                    :description="`${issues.error} — this page reads GitHub from your browser, unauthenticated, which allows 60 requests an hour per address.`"
                />

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="font-semibold">
                                    Open issues
                                </h2>
                                <p class="text-xs text-muted">
                                    Read live from GitHub by your own browser. Nothing is stored here — the issue is
                                    the record, and this is a window onto it.
                                </p>
                            </div>

                            <span class="text-xs text-dimmed shrink-0 tabular-nums">
                                {{ visible.length }} of {{ all.length }}
                            </span>
                        </div>
                    </template>

                    <div
                        v-if="visible.length === 0"
                        class="p-12 text-center"
                    >
                        <UIcon
                            name="i-lucide-circle-dot"
                            class="size-8 text-dimmed mx-auto mb-2"
                        />
                        <p class="text-sm text-muted">
                            {{ all.length === 0 ? "No open issues." : "Nothing matches that filter." }}
                        </p>
                        <p
                            v-if="all.length === 0 && !issues.error"
                            class="text-xs text-dimmed mt-1"
                        >
                            File one with <code class="font-mono">pnpm issue:add</code>.
                        </p>
                    </div>

                    <div
                        v-else
                        class="divide-y divide-default"
                    >
                        <IssueRow
                            v-for="issue in visible"
                            :key="issue.number"
                            :issue="issue"
                        />
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
