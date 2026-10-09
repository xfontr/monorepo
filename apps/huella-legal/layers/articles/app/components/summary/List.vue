<script setup lang="ts">
type Variant = "standard" | "compact" | "row";

interface Props {
    articles: ArticleSummary[]
    variant?: Variant
}

withDefaults(defineProps<Props>(), { variant: "row" });

const SPACING = {
    standard: "py-7",
    compact: "py-4",
    row: "py-6 md:py-8",
} as const satisfies Record<Variant, string>;
</script>

<template>
    <ol class="flex flex-col divide-y divide-(--ui-border-muted)">
        <li
            v-for="article in articles"
            :key="article.id"
            :class="SPACING[variant]"
        >
            <SummaryCard
                :article
                :variant
            />
        </li>
    </ol>
</template>
