<script setup lang="ts">
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    query: string;
    subjects: LinkAction[];
}

defineProps<Props>();

const titleId = useId();
</script>

<template>
    <UEmpty
        as="section"
        :aria-labelledby="titleId"
        :description="$t('noResults.broaden')"
        :ui="{ description: 'max-w-none' }"
    >
        <template #leading>
            <UIcon name="i-lucide-search-x" class="size-7 text-dimmed" />
        </template>
        <template #title>
            <span :id="titleId">{{ $t("noResults.title", { query }) }}</span>
        </template>
        <template v-if="subjects.length" #body>
            <p class="mt-2 font-sans text-meta font-semibold text-highlighted">
                {{ $t("noResults.browse") }}
            </p>
            <ul class="flex flex-wrap gap-2">
                <li v-for="{ label, to } in subjects" :key="label">
                    <BaseTagPill :label :to />
                </li>
            </ul>
        </template>
    </UEmpty>
</template>
