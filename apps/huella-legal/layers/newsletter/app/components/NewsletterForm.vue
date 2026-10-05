<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { type Subscription, subscriptionSchema } from "../../shared/schemas/subscription";

export type Tone = "paper" | "slate";

type Layout = "stacked" | "inline";

interface LayoutRecipe {
    row: string
    field: string | undefined
    button: string | undefined
    block: boolean
}

interface ToneRecipe {
    label: string | undefined
    error: string | undefined
    button: "primary" | "secondary"
}

interface Props {
    layout?: Layout
    tone?: Tone
    pending?: boolean
    error?: string
}

const props = withDefaults(defineProps<Props>(), {
    layout: "stacked",
    tone: "paper",
    pending: false,
    error: undefined,
});

const emit = defineEmits<{ submit: [email: string] }>();

const email = defineModel<string>("email", { default: "" });

const LAYOUTS = {
    stacked: { row: "flex flex-col gap-3", field: undefined, button: undefined, block: true },
    inline: { row: "flex flex-col gap-3 sm:flex-row", field: "flex-1", button: "justify-center sm:self-end", block: false },
} as const satisfies Record<Layout, LayoutRecipe>;

const TONES = {
    paper: { label: undefined, error: undefined, button: "primary" },
    slate: { label: "text-huella-slate-200", error: "text-huella-danger-200", button: "secondary" },
} as const satisfies Record<Tone, ToneRecipe>;

const { t } = useI18n();

const schema = subscriptionSchema((issue) => t(`newsletterForm.email.errors.${issue}`));

// `reactive` unwraps the model ref, so `UForm` writing `state.email` updates `v-model:email`
const state = reactive({ email });

function onSubmit({ data }: FormSubmitEvent<Subscription>) {
    emit("submit", data.email);
}

const arrangement = computed<LayoutRecipe>(() => LAYOUTS[props.layout]);
const colors = computed<ToneRecipe>(() => TONES[props.tone]);
</script>

<template>
    <UForm
        :schema
        :state
        :disabled="pending"
        class="flex flex-col gap-3"
        novalidate
        :aria-busy="pending"
        @submit="onSubmit"
    >
        <div :class="arrangement.row">
            <UFormField
                name="email"
                :label="$t('newsletterForm.email.label')"
                :error
                :class="arrangement.field"
                :ui="{ label: colors.label, error: colors.error }"
            >
                <UInput
                    v-model="state.email"
                    type="email"
                    autocomplete="email"
                    :placeholder="$t('newsletterForm.email.placeholder')"
                    class="w-full"
                />
            </UFormField>
            <UButton
                type="submit"
                :block="arrangement.block"
                :loading="pending"
                :label="$t('newsletterForm.submit')"
                :color="colors.button"
                :class="arrangement.button"
            />
        </div>
        <slot name="note" />
    </UForm>
</template>
