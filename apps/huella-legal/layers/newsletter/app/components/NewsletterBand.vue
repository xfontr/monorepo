<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { NewsletterTone } from "../types/Newsletter";

interface Recipe {
    root: string
    kicker: "teal" | "paper"
    title: string
    note: string
}

interface Props {
    privacyTo: RouteLocationRaw
    tone?: NewsletterTone
    pending?: boolean
    error?: string
}

const props = withDefaults(defineProps<Props>(), {
    tone: "paper",
    pending: false,
    error: undefined,
});

const emit = defineEmits<{ submit: [email: string] }>();

const email = defineModel<string>("email", { default: "" });

const TONES = {
    paper: { root: "bg-ivory-200", kicker: "teal", title: "text-highlighted", note: "text-muted" },
    slate: { root: "bg-huella-slate-800 text-huella-slate-200", kicker: "paper", title: "text-ivory-50", note: "text-huella-slate-300" },
} as const satisfies Record<NewsletterTone, Recipe>;

const ui = computed<Recipe>(() => TONES[props.tone]);
const titleId = useId();
</script>

<template>
    <section
        :aria-labelledby="titleId"
        :class="ui.root"
    >
        <div class="mx-auto grid max-w-site gap-12 px-4 py-16 md:px-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-12 lg:py-20">
            <div class="lg:col-span-6">
                <BaseKicker :tone="ui.kicker">
                    {{ $t("newsletterBand.kicker") }}
                </BaseKicker>
                <h2
                    :id="titleId"
                    class="mt-2 font-serif text-[1.75rem] leading-tight text-balance md:text-h2"
                    :class="ui.title"
                >
                    {{ $t("newsletterBand.title") }}
                </h2>
            </div>

            <NewsletterForm
                v-model:email="email"
                layout="inline"
                :tone
                :pending
                :error
                class="lg:col-span-6"
                @submit="emit('submit', $event)"
            >
                <template #note>
                    <p
                        class="font-sans text-meta"
                        :class="ui.note"
                    >
                        <i18nT
                            keypath="newsletterBand.note"
                            scope="global"
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
                    </p>
                </template>
            </NewsletterForm>
        </div>
    </section>
</template>
