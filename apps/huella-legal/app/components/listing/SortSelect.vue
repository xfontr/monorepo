<script setup lang="ts">
const sort = defineModel<"newest" | "oldest">({ required: true });
</script>

<template>
    <label class="-mr-2 flex shrink-0 items-center font-sans text-meta text-muted">
        <span
            aria-hidden="true"
            class="hidden sm:inline"
        >{{ $t("sortSelect.prefix") }}</span>
        <USelect
            v-model="sort"
            :aria-label="$t('sortSelect.label')"
            variant="ghost"
            trailing-icon="i-lucide-chevron-down"
            :items="[
                { label: $t('sortSelect.newest'), value: 'newest' },
                { label: $t('sortSelect.oldest'), value: 'oldest' },
            ]"
        />
    </label>
</template>
