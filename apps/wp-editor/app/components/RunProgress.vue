<script setup lang="ts">
import type { RunReport } from "#shared/types.ts";

interface Props {
    kind: RunReport["kind"];
    /** Null until the first progress save is read back. */
    report: RunReport | null;
    currentTitle?: string;
}

const props = defineProps<Props>();

const done = computed(() => {
    const { ok = [], refused = [], failed = [] } = props.report ?? {};

    return ok.length + refused.length + failed.length;
});

const counts = computed(() => {
    const { ok = [], refused = [], failed = [] } = props.report ?? {};

    return [
        {
            label: props.kind === "apply" ? "Applied" : "Would apply",
            color: "success",
            n: ok.length,
        },
        { label: "Refused", color: "warning", n: refused.length },
        { label: "Failed", color: "error", n: failed.length },
    ] as const;
});
</script>

<template>
    <UPageCard variant="subtle" class="shrink-0">
        <div class="flex flex-col gap-3">
            <div class="flex items-baseline justify-between gap-4">
                <p class="font-semibold">{{ kind === "apply" ? "Bulk apply" : "Dry run" }}</p>
                <p class="text-sm text-muted tabular-nums">
                    {{ report?.total === undefined ? "Starting…" : `${done} / ${report.total}` }}
                </p>
            </div>

            <UProgress :model-value="report?.total ? done : null" :max="report?.total" />

            <p v-if="report?.current" class="truncate text-sm">
                <span class="text-muted">{{ kind === "apply" ? "Writing" : "Checking" }}</span>
                {{ report.current }}<template v-if="currentTitle"> · {{ currentTitle }}</template>
            </p>
            <p v-else-if="report" class="text-sm text-muted">Pausing before the next article</p>

            <div class="flex flex-wrap gap-2">
                <UBadge
                    v-for="count in counts"
                    :key="count.label"
                    :color="count.color"
                    variant="subtle"
                    :label="`${count.label} ${count.n}`"
                />
            </div>
        </div>
    </UPageCard>
</template>
