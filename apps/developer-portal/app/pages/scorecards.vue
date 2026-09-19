<script setup lang="ts">
const { data: snapshot } = await useSnapshot();

const reviews = computed(() => snapshot.value?.scorecards?.reviews ?? []);
const latest = computed(() => reviews.value[0] ?? null);

const weakest = computed(() => {
    if (!latest.value || latest.value.cards.length === 0) return null;

    return latest.value.cards.reduce((worst, card) => (card.score < worst.score ? card : worst));
});

function idOf(path: string): string {
    return path.split("/").at(-1) ?? path;
}
</script>

<template>
    <UDashboardPanel id="scorecards">
        <template #header>
            <UDashboardNavbar title="Scorecards">
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
                    <SnapshotAge
                        :manifest="snapshot?.manifest ?? null"
                        artifact="scorecards"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div
                v-if="!latest"
                class="p-12 text-center"
            >
                <UIcon
                    name="i-lucide-target"
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
                class="flex flex-col gap-4"
            >
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatTile
                        label="Total"
                        :value="`${latest.total}/5`"
                        :hint="latest.totalDelta === '—' || latest.totalDelta === '' ? 'first review' : `${latest.totalDelta} since the previous one`"
                        :tone="scoreTone(latest.total)"
                    />
                    <StatTile
                        label="Latest review"
                        :value="latest.date"
                        :hint="`commit ${latest.commit}`"
                        icon="i-lucide-clipboard-check"
                        :to="`/reviews/${idOf(latest.path)}`"
                    />
                    <StatTile
                        label="Reviews collected"
                        :value="reviews.length"
                        hint="one dated file per review"
                        icon="i-lucide-history"
                        to="/reviews"
                    />
                    <StatTile
                        label="Weakest card"
                        :value="weakest ? weakest.card : '—'"
                        :hint="weakest ? `${weakest.score}/5` : 'nothing parsed'"
                        :tone="weakest ? scoreTone(weakest.score) : 'neutral'"
                    />
                </div>

                <UAlert
                    v-if="latest.parseError"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-triangle-alert"
                    title="This review's Scores table didn't fully parse"
                    :description="latest.parseError"
                />

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                By card — {{ latest.date }}
                            </h2>
                            <p class="text-xs text-muted">
                                Copied from the review's own <code class="font-mono">## 🧮 Scores</code> table,
                                not recomputed — the total and the verdicts are exactly what
                                <code class="font-mono">repo-review</code> wrote.
                            </p>
                        </div>
                    </template>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="text-xs text-muted border-b border-default">
                                <tr>
                                    <th class="text-left font-medium px-4 py-2">
                                        Card
                                    </th>
                                    <th class="text-right font-medium px-3 py-2">
                                        Score
                                    </th>
                                    <th class="text-right font-medium px-3 py-2">
                                        Δ
                                    </th>
                                    <th class="text-left font-medium px-4 py-2">
                                        Verdict
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-default">
                                <tr
                                    v-for="card in latest.cards"
                                    :key="card.card"
                                    class="hover:bg-elevated/40"
                                >
                                    <td class="px-4 py-2 whitespace-nowrap">
                                        {{ card.card }}
                                    </td>
                                    <td
                                        class="px-3 py-2 text-right tabular-nums"
                                        :class="`tone-${scoreTone(card.score)}`"
                                    >
                                        {{ card.score }}/5
                                    </td>
                                    <td class="px-3 py-2 text-right tabular-nums text-muted">
                                        {{ card.delta }}
                                    </td>
                                    <td class="px-4 py-2 text-muted">
                                        {{ card.verdict }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UCard>

                <UCard
                    v-if="reviews.length > 1"
                    :ui="{ body: 'p-0 sm:p-0' }"
                >
                    <template #header>
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="font-semibold">
                                    History
                                </h2>
                                <p class="text-xs text-muted">
                                    Every review the collector could read, newest first.
                                </p>
                            </div>

                            <UButton
                                to="/docs/docs/reviews/readme"
                                label="Full history table"
                                icon="i-lucide-table"
                                color="neutral"
                                variant="subtle"
                                size="xs"
                            />
                        </div>
                    </template>

                    <div class="divide-y divide-default">
                        <NuxtLink
                            v-for="review in reviews"
                            :key="review.path"
                            :to="`/reviews/${idOf(review.path)}`"
                            class="flex items-center gap-3 px-4 py-2.5 hover:bg-elevated/40 transition-colors"
                        >
                            <span class="text-sm font-mono">{{ review.date }}</span>
                            <span class="text-xs text-dimmed font-mono">{{ review.commit }}</span>

                            <span class="flex-1" />

                            <span
                                v-if="review.parseError"
                                class="text-xs text-dimmed italic"
                            >couldn't parse</span>
                            <span
                                v-else
                                class="text-sm font-semibold tabular-nums"
                                :class="`tone-${scoreTone(review.total)}`"
                            >{{ review.total }}/5</span>
                        </NuxtLink>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>
