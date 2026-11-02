<script setup lang="ts">
import { isApplied, isPending } from "#shared/rules.ts";
import type { Item } from "#shared/types.ts";
import type { ItemAction } from "~/composables/useChangeset";

interface Props {
    item: Item;
    busy: string | null;
    dirty: boolean;
    dryRun: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ act: [action: ItemAction]; save: []; discard: [] }>();

const pending = computed(() => isPending(props.item));
const applying = computed(
    () => !!props.busy?.startsWith("Apply") || !!props.busy?.startsWith("Dry-run"),
);
const restoring = computed(() => !!props.busy?.startsWith("Restore"));
const live = computed(() => isApplied(props.item));
const confirmed = computed(() => props.item.state.level === "confirmed");
const rejected = computed(() => !!props.item.state.rejected);
</script>

<template>
    <div class="flex flex-wrap items-center gap-2">
        <template v-if="dirty">
            <UButton
                icon="i-lucide-save"
                label="Save edit"
                :loading="!!busy"
                @click="emit('save')"
            />
            <UButton color="neutral" variant="ghost" label="Discard" @click="emit('discard')" />
            <USeparator orientation="vertical" class="h-6" />
        </template>

        <UButton
            v-if="item.state.drift"
            icon="i-lucide-refresh-cw"
            color="warning"
            label="Re-pull"
            :loading="!!busy"
            @click="emit('act', 'repull')"
        />

        <UTooltip :text="confirmed ? 'Back to seen' : 'Confirm'" :kbds="['c']">
            <UButton
                v-if="confirmed && pending"
                icon="i-lucide-check-check"
                color="success"
                variant="solid"
                label="Confirmed"
                :disabled="dirty"
                @click="emit('act', 'unconfirm')"
            />
            <UButton
                v-else
                icon="i-lucide-check"
                color="success"
                variant="soft"
                label="Confirm"
                :disabled="!pending || dirty"
                @click="emit('act', 'confirm')"
            />
        </UTooltip>
        <UButton
            v-if="rejected"
            icon="i-lucide-rotate-ccw"
            color="error"
            variant="outline"
            label="Undo reject"
            @click="emit('act', 'unreject')"
        />
        <UButton
            v-else
            icon="i-lucide-x"
            color="error"
            variant="soft"
            label="Reject"
            :disabled="!pending || dirty"
            @click="emit('act', 'reject')"
        />
        <UButton
            :icon="dryRun ? 'i-lucide-flask-conical' : 'i-lucide-upload'"
            :label="dryRun ? 'Dry run' : 'Apply'"
            :disabled="!pending || dirty || !!item.state.drift"
            :loading="applying"
            @click="emit('act', dryRun ? 'dry-run' : 'apply')"
        />
        <UButton
            v-if="live"
            icon="i-lucide-undo-2"
            color="neutral"
            variant="outline"
            label="Restore"
            :disabled="dryRun"
            :loading="restoring"
            @click="emit('act', 'restore')"
        />
    </div>
</template>
