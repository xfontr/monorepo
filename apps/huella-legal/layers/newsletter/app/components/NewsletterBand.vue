<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { Tone } from "~/types/Tone";
import NewsletterForm from "./NewsletterForm.vue";

interface Recipe {
    root: string;
    title: string;
    note: string;
}

interface Props {
    privacyTo: RouteLocationRaw;
    tone?: Tone;
    pending?: boolean;
    error?: string;
}

const props = withDefaults(defineProps<Props>(), {
    tone: "paper",
    pending: false,
});

const emit = defineEmits<{ submit: [email: string] }>();

const TONES = {
    paper: { root: "bg-ivory-200", title: "text-highlighted", note: "text-muted" },
    slate: {
        root: "bg-huella-slate-800 text-huella-slate-200",
        title: "text-ivory-50",
        note: "text-huella-slate-300",
    },
} as const satisfies Record<Tone, Recipe>;

const ui = computed<Recipe>(() => TONES[props.tone]);
const titleId = useId();
</script>

<template>
    <section :aria-labelledby="titleId" :class="ui.root">
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

            <NewsletterForm
                layout="inline"
                :tone
                :pending
                :error
                class="lg:col-span-6"
                @submit="emit('submit', $event)"
            >
                <template #note>
                    <i18nT
                        keypath="newsletterBand.note"
                        scope="global"
                        tag="p"
                        class="font-sans text-meta"
                        :class="ui.note"
                    >
                        <template #privacy>
                            <ULink
                                raw
                                :to="privacyTo"
                                data-inline
                                class="underline underline-offset-2"
                            >
                                {{ $t("newsletterBand.privacy") }}
                            </ULink>
                        </template>
                    </i18nT>
                </template>
            </NewsletterForm>
        </UContainer>
    </section>
</template>
