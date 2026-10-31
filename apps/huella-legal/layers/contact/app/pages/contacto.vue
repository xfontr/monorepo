<script setup lang="ts">
definePageMeta({ name: "contact", path: "/contacto/" });

const { t } = useI18n();

useSeoMeta({
    title: () => t("contact.breadcrumb"),
    description: () => t("contact.lead"),
});
</script>

<template>
    <div>
        <BasePageIntro :breadcrumbs="[{ label: $t('contact.breadcrumb') }]">
            <BasePageHeading
                :kicker="$t('contact.kicker')"
                :title="$t('contact.title')"
                :lead="$t('contact.lead')"
                class="lg:w-7/12"
            />
        </BasePageIntro>
        <UContainer class="pt-10 pb-16 lg:pb-20">
            <ContactForm class="lg:w-7/12" />
        </UContainer>
    </div>
</template>
