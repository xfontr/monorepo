<script setup lang="ts">
const route = useRoute();

const { data: reviews } = await useReviewPages();

/**
 * One route for the list and for a single review, because the list is short and the page is
 * useless without one open — but the id still lives in the URL, so a review can be linked to.
 */
const selected = computed(() => {
    const id = (route.params.id as string | undefined) ?? "";

    return id.length > 0 ? `/docs/reviews/${id}` : reviews.value[0]?.path ?? null;
});

const { data: page } = await useAsyncData(
    () => `review-${selected.value ?? "none"}`,
    () => (selected.value === null ? Promise.resolve(null) : queryCollection("docs").path(selected.value).first()),
    { watch: [selected] },
);

function idOf(path: string): string {
    return path.split("/").at(-1) ?? path;
}
</script>

<template>
    <UDashboardPanel id="reviews">
        <template #header>
            <UDashboardNavbar title="Reviews">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton
                        to="/docs/docs/reviews/scorecards"
                        label="The rubric"
                        icon="i-lucide-ruler"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div
                v-if="reviews.length === 0"
                class="p-12 text-center"
            >
                <UIcon
                    name="i-lucide-clipboard-check"
                    class="size-8 text-dimmed mx-auto mb-2"
                />
                <p class="text-sm text-muted">
                    No review under <code class="font-mono">docs/reviews/</code> yet.
                </p>
                <p class="text-xs text-dimmed mt-1">
                    The <code class="font-mono">repo-review</code> skill writes them, one dated file per review.
                </p>
            </div>

            <div
                v-else
                class="grid lg:grid-cols-4 gap-4"
            >
                <div class="flex flex-col gap-3">
                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <div class="divide-y divide-default">
                            <NuxtLink
                                v-for="review in reviews"
                                :key="review.path"
                                :to="`/reviews/${idOf(review.path)}`"
                                class="block px-4 py-2.5 hover:bg-elevated/40 transition-colors"
                                :class="selected === review.path ? 'bg-elevated/60' : ''"
                            >
                                <div class="text-sm font-mono truncate">
                                    {{ idOf(review.path) }}
                                </div>
                            </NuxtLink>
                        </div>
                    </UCard>

                    <UAlert
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-info"
                        title="A review is a dated snapshot"
                        description="Nothing here is recomputed — this is the file the repo-review skill wrote. The scorecards page reads the same numbers back out of it for a dashboard view."
                        :ui="{ description: 'text-xs' }"
                    />

                    <UButton
                        to="/scorecards"
                        label="Scorecards"
                        icon="i-lucide-target"
                        color="neutral"
                        variant="subtle"
                        size="xs"
                        block
                    />

                    <UButton
                        to="/docs/docs/reviews/readme"
                        label="History table"
                        icon="i-lucide-table"
                        color="neutral"
                        variant="subtle"
                        size="xs"
                        block
                    />
                </div>

                <UCard class="lg:col-span-3">
                    <ContentRenderer
                        v-if="page"
                        :value="page"
                    />

                    <UAlert
                        v-else
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-file-question"
                        title="No such review"
                        :description="`Nothing under docs/reviews/ matches ${route.params.id}.`"
                    />
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
