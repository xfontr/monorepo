<template>
    <section aria-label="Estimate breakdown" class="flex flex-col gap-2">
        <p class="text-xs font-medium text-muted">What's in it</p>
        <ul class="flex flex-col gap-1.5 text-sm">
            <li
                v-for="(row, index) in rows"
                :key="row.id"
                class="flex items-baseline justify-between gap-3"
            >
                <span class="min-w-0 truncate" :class="row.nested ? 'pl-4 text-muted' : ''">
                    <span v-if="index > 0" class="text-dimmed">+ </span>{{ row.label
                    }}<span v-if="row.detail" class="text-xs text-muted"> · {{ row.detail }}</span>
                </span>
                <span class="shrink-0 text-muted tabular-nums">{{ row.points }} SP</span>
            </li>
        </ul>
        <p
            class="flex justify-between border-t border-dashed border-default pt-2 text-sm font-semibold"
        >
            <span>Total</span>
            <span class="tabular-nums">{{ total }} SP</span>
        </p>
    </section>
</template>

<script setup lang="ts">
import type { ReceiptRow } from "#layers/workflows/shared/workflows.ts";

interface Props {
    rows: ReceiptRow[];
    total: number;
}

const { rows, total } = defineProps<Props>();
</script>
