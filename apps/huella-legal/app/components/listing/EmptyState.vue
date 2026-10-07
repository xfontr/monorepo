<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface Props {
    subject: string
    publishTo: RouteLocationRaw
    browseTo: RouteLocationRaw
}

defineProps<Props>();

const titleId = useId();
</script>

<template>
    <UEmpty
        as="section"
        :aria-labelledby="titleId"
        variant="naked"
        :description="$t('emptyState.description')"
        :actions="[
            { label: $t('emptyState.publish'), to: publishTo, class: 'justify-center' },
            { label: $t('emptyState.browse'), to: browseTo, variant: 'outline', color: 'neutral', class: 'justify-center' },
        ]"
        class="border border-dashed border-(--ui-border-accented) bg-ivory-50"
    >
        <template #leading>
            <UIcon
                name="i-lucide-feather"
                class="size-7 text-huella-teal-500"
            />
        </template>
        <template #title>
            <span :id="titleId">{{ $t("emptyState.title", { subject }) }}</span>
        </template>
    </UEmpty>
</template>
