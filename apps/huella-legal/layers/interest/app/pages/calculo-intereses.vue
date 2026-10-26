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
        <ArchiveIntro :breadcrumbs="[{ label: $t('interestCalculator.title') }]">
            <ArchiveHeading
                :kicker="$t('interestCalculator.kicker')"
                :title="$t('interestCalculator.title')"
                :lead="$t('interestCalculator.lead')"
                class="lg:w-7/12"
            />
        </ArchiveIntro>
        <UContainer class="pt-10 pb-16 lg:pb-20">
            <InterestCalculator />
        </UContainer>
    </div>
</template>
