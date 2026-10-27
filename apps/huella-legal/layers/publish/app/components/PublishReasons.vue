<script setup lang="ts">
const REASONS = [
    { key: "visibility", icon: "i-lucide-eye" },
    { key: "review", icon: "i-lucide-scale" },
    { key: "free", icon: "i-lucide-badge-check" },
] as const;
</script>

<template>
    <ul class="flex flex-col divide-y divide-(--ui-border-muted) border-t border-default">
        <UPageFeature
            v-for="reason in REASONS"
            :key="reason.key"
            as="li"
            :icon="reason.icon"
            :title="$t(`publish.reasons.${reason.key}.title`)"
            :description="$t(`publish.reasons.${reason.key}.body`)"
            :ui="{
                root: 'gap-4 py-5',
                leading: 'size-11 shrink-0 rounded-full bg-huella-teal-100 p-0',
                leadingIcon: 'text-huella-teal-700',
                title: 'font-serif text-xl font-normal',
                description: 'mt-1 font-serif text-base leading-relaxed text-toned',
            }"
        />
    </ul>
</template>
