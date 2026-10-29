<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";

interface Props {
    breadcrumbs: BreadcrumbItem[];
}

defineProps<Props>();
</script>

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
            />
            <div class="mt-6 md:mt-8">
                <slot />
            </div>
        </UContainer>
    </section>
</template>
