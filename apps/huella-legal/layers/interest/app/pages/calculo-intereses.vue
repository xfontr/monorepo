<script setup lang="ts">
definePageMeta({ name: "interestCalculator", path: "/calculo-intereses/" });

const { t } = useI18n();

useSeoMeta({
    title: () => t("interestCalculator.title"),
    description: () => t("interestCalculator.lead"),
});
</script>

<template>
    <div>
        <BasePageIntro :breadcrumbs="[{ label: $t('interestCalculator.title') }]">
            <BasePageHeading
                :kicker="$t('interestCalculator.kicker')"
                :title="$t('interestCalculator.title')"
                :lead="$t('interestCalculator.lead')"
                class="lg:w-7/12"
            />
        </BasePageIntro>
        <UContainer class="pt-10 pb-16 lg:pb-20">
            <InterestCalculator />
        </UContainer>
    </div>
</template>
