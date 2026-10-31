<script setup lang="ts">
interface SortCopy {
    label: string;
    newest: string;
    oldest: string;
}

interface Props {
    copy?: SortCopy;
}

const props = defineProps<Props>();

const sort = defineModel<"newest" | "oldest">({ required: true });

const { t } = useI18n();

const words = computed<SortCopy>(
    () =>
        props.copy ?? {
            label: t("sortSelect.label"),
            newest: t("sortSelect.newest"),
            oldest: t("sortSelect.oldest"),
        },
);

const items = computed(() => [
    { label: words.value.newest, value: "newest" as const },
    { label: words.value.oldest, value: "oldest" as const },
]);
</script>

<template>
    <label class="-mr-2 flex shrink-0 items-center font-sans text-meta text-muted">
        <span aria-hidden="true" class="hidden sm:inline">{{ $t("sortSelect.prefix") }}</span>
        <USelect
            v-model="sort"
            :aria-label="words.label"
            variant="ghost"
            trailing-icon="i-lucide-chevron-down"
            :items
        />
    </label>
</template>
