<template>
    <section class="border-b border-default">
        <UContainer class="pt-6 pb-10 md:pt-10 lg:pb-12">
            <UBreadcrumb
                :items="[
                    {
                        label: $t('pageIntro.home'),
                        to: { name: 'index' },
                    },
                    ...breadcrumbs,
                ]"
                class="mb-6 md:mb-8"
            />
            <slot />
        </UContainer>
    </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";

interface Props {
    breadcrumbs: BreadcrumbItem[];
}

defineProps<Props>();
</script>
