<script setup lang="ts">
import type { Tone } from "~/types/Tone";
import { NEWSLETTER_ID } from "../composables/useNewsletterJump";
import NewsletterForm from "./NewsletterForm.vue";

interface Recipe {
    root: string;
    title: string;
}

interface Props {
    tone?: Tone;
}

const props = withDefaults(defineProps<Props>(), {
    tone: "paper",
});

const TONES = {
    // ivory-200 leaves teal-600 and ink-600 under 4.5:1, so the band darkens both tokens a step
    paper: {
        root: "bg-ivory-200 [--ui-secondary:var(--color-huella-teal-700)] [--ui-text-muted:var(--color-huella-ink-700)]",
        title: "text-highlighted",
    },
    slate: { root: "bg-huella-slate-800 text-huella-slate-200", title: "text-ivory-50" },
} as const satisfies Record<Tone, Recipe>;

const ui = computed<Recipe>(() => TONES[props.tone]);
const titleId = useId();
</script>

<template>
    <section
        :id="NEWSLETTER_ID"
        :aria-labelledby="titleId"
        class="scroll-mt-(--ui-header-height)"
        :class="ui.root"
    >
        <UContainer class="grid gap-12 py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20">
            <div class="lg:col-span-6">
                <BaseKicker :tone>
                    {{ $t("newsletterBand.kicker") }}
                </BaseKicker>
                <h2
                    :id="titleId"
                    class="mt-2 font-serif text-section text-balance md:text-h2"
                    :class="ui.title"
                >
                    {{ $t("newsletterBand.title") }}
                </h2>
            </div>

            <NewsletterForm layout="inline" :tone class="lg:col-span-6" />
        </UContainer>
    </section>
</template>
