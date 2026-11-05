<template>
    <!-- ivory-200 leaves teal-600 and ink-600 under 4.5:1, so the band darkens both tokens a step -->
    <section
        :id="NEWSLETTER_ID"
        :aria-labelledby="titleId"
        class="scroll-mt-(--ui-header-height) bg-accented [--ui-secondary:var(--color-huella-teal-700)] [--ui-text-muted:var(--color-huella-ink-700)]"
    >
        <UContainer class="grid gap-12 py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20">
            <div class="lg:col-span-6">
                <BaseKicker>
                    {{ $t("newsletterBand.kicker") }}
                </BaseKicker>
                <h2
                    :id="titleId"
                    class="mt-2 font-serif text-section text-balance text-highlighted md:text-h2"
                >
                    {{ $t("newsletterBand.title") }}
                </h2>
            </div>

            <NewsletterForm layout="inline" class="lg:col-span-6" />
        </UContainer>
    </section>
</template>

<script setup lang="ts">
import { NEWSLETTER_ID } from "../composables/useNewsletterJump";
import NewsletterForm from "./NewsletterForm.vue";

const titleId = useId();
</script>
