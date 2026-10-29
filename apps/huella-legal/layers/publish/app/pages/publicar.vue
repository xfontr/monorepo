<script setup lang="ts">
definePageMeta({ name: "publish", path: "/publicar/" });

const { t } = useI18n();

useSeoMeta({
    title: () => t("publish.breadcrumb"),
    description: () => t("publish.lead"),
});
</script>

<template>
    <div>
        <BasePageIntro :breadcrumbs="[{ label: $t('publish.breadcrumb') }]">
            <div class="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-12">
                <div class="lg:col-span-7">
                    <BasePageHeading
                        :kicker="$t('publish.kicker')"
                        :title="$t('publish.title')"
                        :lead="$t('publish.lead')"
                    />
                    <div class="mt-7 flex flex-col gap-3 sm:flex-row">
                        <UButton
                            :label="$t('publish.actions.article')"
                            :to="{ hash: '#propuesta' }"
                            class="justify-center"
                        />
                        <UButton
                            variant="outline"
                            color="neutral"
                            :label="$t('publish.actions.thesis')"
                            :to="{ hash: '#tesis' }"
                            class="justify-center"
                        />
                    </div>
                </div>
                <PublishReasons class="self-end lg:col-span-5" />
            </div>
        </BasePageIntro>
        <UContainer class="py-16 lg:py-20">
            <PublishSteps />
        </UContainer>
        <div class="border-y border-default bg-ivory-50">
            <UContainer class="grid grid-cols-1 gap-12 py-16 lg:grid-cols-12 lg:py-20">
                <PublishProposal id="propuesta" class="lg:col-span-7" />
                <div class="flex flex-col gap-12 lg:col-span-5 lg:gap-16">
                    <PublishFaq />
                    <PublishThesis id="tesis" />
                </div>
            </UContainer>
        </div>
    </div>
</template>
