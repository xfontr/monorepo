<template>
    <UDashboardPanel id="changesets">
        <template #header>
            <UDashboardNavbar title="Changesets" icon="i-lucide-layers" />
        </template>

        <template #body>
            <UAlert
                v-if="error"
                color="error"
                variant="subtle"
                icon="i-lucide-triangle-alert"
                title="The store can't be read"
                :description="errorMessage"
            />

            <UEmpty
                v-else-if="changesets.length === 0"
                icon="i-lucide-layers"
                title="No changesets yet"
                description='Claude opens one with `pnpm editor new "<title>"`; it shows up here to review.'
            />

            <div v-else class="grid gap-4 lg:grid-cols-2">
                <NuxtLink
                    v-for="changeset in changesets"
                    :key="changeset.id"
                    :to="`/changesets/${changeset.id}`"
                >
                    <UCard class="h-full transition-colors hover:bg-elevated/50">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="truncate font-semibold">{{ changeset.title }}</p>
                                <p class="text-xs text-muted">
                                    {{ changeset.id }} · {{ formatDate(changeset.createdAt) }}
                                </p>
                            </div>
                            <UBadge
                                :color="STATUS_COLOR[changeset.status]"
                                variant="subtle"
                                :label="changeset.status"
                            />
                        </div>

                        <p
                            v-if="changeset.instructions"
                            class="mt-3 line-clamp-2 text-sm text-muted"
                        >
                            {{ changeset.instructions }}
                        </p>

                        <UProgress
                            v-if="changeset.counts.proposals > 0"
                            class="mt-4"
                            :model-value="changeset.counts.proposals - changeset.counts.pending"
                            :max="changeset.counts.proposals"
                            size="sm"
                        />

                        <dl class="mt-3 grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
                            <div v-for="(value, label) in changeset.counts" :key="label">
                                <dt class="text-xs text-dimmed capitalize">{{ label }}</dt>
                                <dd class="font-medium tabular-nums">{{ value }}</dd>
                            </div>
                        </dl>
                    </UCard>
                </NuxtLink>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { BadgeProps } from "@nuxt/ui";
import type { Changeset } from "#shared/types.ts";

interface Row extends Changeset {
    counts: Record<
        "articles" | "scanned" | "proposals" | "pending" | "applied" | "rejected",
        number
    >;
}

const { data: changesets, error } = await useFetch<Row[]>("/api/changesets", { default: () => [] });
const errorMessage = computed(() => (error.value ? messageOf(error.value) : ""));

const STATUS_COLOR = {
    open: "primary",
    closed: "success",
    abandoned: "neutral",
} as const satisfies Record<Changeset["status"], BadgeProps["color"]>;
</script>
