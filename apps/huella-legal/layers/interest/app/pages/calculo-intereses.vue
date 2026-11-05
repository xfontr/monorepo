<template>
    <div>
        <BasePageIntro :breadcrumbs="[{ label: $t('interestCalculator.breadcrumb') }]">
            <BasePageHeading
                :kicker="$t('interestCalculator.kicker')"
                :title="$t('interestCalculator.title')"
                :lead="$t('interestCalculator.lead')"
                class="lg:w-8/12"
            />
        </BasePageIntro>
        <UContainer class="pt-8 pb-16 lg:pb-20">
            <InterestCalculator />
        </UContainer>
        <div v-if="guide" class="border-t border-default bg-ivory-50/60">
            <UContainer class="py-16 lg:py-20">
                <ArticleProse :lead="guide.body.lead" :html="guide.body.html" />
            </UContainer>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ name: "interestCalculator", path: "/calculo-intereses/" });

const { t } = useI18n();

// The guide is the WordPress page's copy, so the calculator still renders when WordPress fails
const { data: guide } = await useCachedFetch<Page>("/api/pages/calculo-intereses");

useSeoMeta({
    title: () => t("interestCalculator.title"),
    description: () => t("interestCalculator.lead"),
});
</script>
