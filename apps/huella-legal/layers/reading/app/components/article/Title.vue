<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";

interface Props {
    breadcrumb: BreadcrumbItem[];
    title: string;
}

defineProps<Props>();
</script>

<template>
    <UContainer as="header" class="grid grid-cols-1 pt-6 md:pt-10 lg:grid-cols-12 lg:gap-x-8">
        <div class="lg:col-span-9 lg:col-start-4">
            <UBreadcrumb :items="breadcrumb" class="print:hidden" />
            <slot name="kicker" />
            <h1
                :class="$slots.kicker ? 'mt-4' : 'mt-6 md:mt-8'"
                class="max-w-[18ch] font-serif text-display-sm text-highlighted text-balance md:text-display lg:text-display-lg"
            >
                {{ title }}
            </h1>
            <slot />
        </div>
    </UContainer>
</template>
