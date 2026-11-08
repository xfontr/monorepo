<template>
    <UContainer class="py-12 md:py-20">
        <section class="flex flex-col items-start lg:w-7/12">
            <span
                class="flex size-11 items-center justify-center rounded-full bg-secondary-600 text-inverted"
            >
                <UIcon name="i-lucide-check" class="size-5" />
            </span>
            <BaseKicker class="mt-6">{{ $t("newsletterConfirmed.kicker") }}</BaseKicker>
            <h1 class="mt-2 font-serif text-h1 text-balance text-highlighted md:text-display">
                {{ $t("newsletterConfirmed.title") }}
            </h1>
            <p class="mt-4 max-w-measure font-serif text-reading text-toned">
                {{ $t("newsletterConfirmed.lead") }}
            </p>
            <div class="mt-8 flex flex-col gap-3 self-stretch sm:flex-row sm:self-start">
                <UButton
                    :to="{ name: 'publications' }"
                    trailing-icon="i-lucide-arrow-right"
                    :label="$t('newsletterConfirmed.latest')"
                    class="justify-center"
                />
                <UButton
                    :to="{ name: 'categories' }"
                    variant="outline"
                    color="neutral"
                    :label="$t('newsletterConfirmed.categories')"
                    class="justify-center"
                />
            </div>
        </section>
    </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ name: "newsletterConfirmed", path: "/suscripcion-confirmada/" });

const { t } = useI18n();

useSeoMeta({ title: () => t("newsletterConfirmed.title") });
</script>
