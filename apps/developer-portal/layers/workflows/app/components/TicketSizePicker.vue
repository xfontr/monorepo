<template>
    <div
        role="radiogroup"
        aria-label="Ticket size"
        :class="compact ? 'flex flex-col gap-1' : 'grid gap-3 sm:grid-cols-3'"
    >
        <button
            v-for="option in options"
            :key="option.size"
            type="button"
            role="radio"
            :aria-checked="option.size === modelValue"
            :title="option.summary"
            :disabled="!editable"
            class="text-left transition-colors enabled:cursor-pointer enabled:hover:bg-elevated/50 disabled:cursor-not-allowed"
            :class="[
                compact
                    ? 'flex items-center gap-2 rounded-lg border px-3 py-2'
                    : 'flex flex-col gap-2 rounded-xl border p-4',
                option.size === modelValue
                    ? 'border-primary bg-primary/5'
                    : compact
                      ? 'border-transparent'
                      : 'border-default bg-default',
                !editable && option.size !== modelValue ? 'opacity-50' : '',
            ]"
            @click="emit('update:modelValue', option.size)"
        >
            <template v-if="compact">
                <UIcon
                    :name="option.size === modelValue ? 'i-lucide-circle-dot' : 'i-lucide-circle'"
                    class="size-4 shrink-0"
                    :class="option.size === modelValue ? 'text-primary' : 'text-dimmed'"
                />
                <span class="flex-1 text-sm">{{ option.title }}</span>
                <span v-if="option.count !== null" class="text-sm font-semibold tabular-nums">{{
                    option.count
                }}</span>
            </template>
            <template v-else>
                <span v-if="option.count !== null" class="flex items-baseline gap-1.5">
                    <span class="text-3xl font-semibold tabular-nums">{{ option.count }}</span>
                    <span class="text-sm text-muted">{{
                        option.count === 1 ? "ticket" : "tickets"
                    }}</span>
                </span>
                <span class="font-semibold">{{ option.title }}</span>
                <span class="text-sm text-muted">{{ option.summary }}</span>
            </template>
        </button>
    </div>
</template>

<script setup lang="ts">
import {
    TICKET_SIZE_LABELS,
    TICKET_SIZES,
    type TicketSize,
} from "#layers/workflows/shared/workflows.ts";

interface Props {
    modelValue: TicketSize;
    /** Tickets each size would file; left out where the choice is already made, such as settings. */
    counts?: Record<TicketSize, number> | null;
    editable?: boolean;
    /** One line per size, for a side panel; the summary moves to a tooltip. */
    compact?: boolean;
}

const { modelValue, counts = null, editable = false, compact = false } = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [size: TicketSize] }>();

const options = computed(() =>
    TICKET_SIZES.map((size) => ({
        size,
        count: counts?.[size] ?? null,
        ...TICKET_SIZE_LABELS[size],
    })),
);
</script>
