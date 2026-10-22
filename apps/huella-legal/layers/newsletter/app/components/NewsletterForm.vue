<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { DESTINATIONS } from "~/composables/useSiteNav";
import type { Tone } from "~/types/Tone";
import {
    type Subscription,
    type SubscriptionIssue,
    subscriptionSchema,
} from "../../shared/schemas/subscription";
import { useNewsletter } from "../composables/useNewsletter";

type Layout = "stacked" | "inline";

interface LayoutRecipe {
    row: string;
    field: string | undefined;
    button: string | undefined;
    block: boolean;
}

interface ToneRecipe {
    label: string | undefined;
    error: string | undefined;
    notice: string;
    button: "primary" | "secondary";
}

interface Props {
    layout?: Layout;
    tone?: Tone;
}

const props = withDefaults(defineProps<Props>(), {
    layout: "stacked",
    tone: "paper",
});

const LAYOUTS = {
    stacked: { row: "flex flex-col gap-3", field: undefined, button: undefined, block: true },
    inline: {
        row: "flex flex-col gap-3 sm:flex-row",
        field: "flex-1",
        button: "justify-center sm:self-end",
        block: false,
    },
} as const satisfies Record<Layout, LayoutRecipe>;

const TONES = {
    paper: { label: undefined, error: undefined, notice: "text-muted", button: "primary" },
    slate: {
        label: "text-huella-slate-200",
        error: "text-huella-danger-200",
        notice: "text-huella-slate-300",
        button: "secondary",
    },
} as const satisfies Record<Tone, ToneRecipe>;

const { t } = useI18n();
const { status, errors, subscribe } = useNewsletter();

const word = (issue: SubscriptionIssue): string => t(`newsletterForm.email.errors.${issue}`);
const schema = subscriptionSchema(word);

const state = reactive({ email: "" });
const website = ref<string>("");

const form = useTemplateRef("form");

const onSubmit = async ({ data }: FormSubmitEvent<Subscription>, challenge: Challenge) => {
    await subscribe({ email: data.email, website: website.value }, challenge);

    form.value?.setErrors(
        errors.value.map(({ name, message }) => ({ name, message: word(message) })),
    );
};

const pending = computed<boolean>(() => status.value === "submitting");
const arrangement = computed<LayoutRecipe>(() => LAYOUTS[props.layout]);
const colors = computed<ToneRecipe>(() => TONES[props.tone]);
</script>

<template>
    <FormSuccessPanel v-if="status === 'success'" :title="$t('newsletterForm.success.title')">
        {{ $t("newsletterForm.success.description") }}
    </FormSuccessPanel>
    <FormChallenge v-else v-slot="{ challenge }">
        <UForm
            ref="form"
            :schema
            :state
            :disabled="pending"
            class="flex flex-col gap-3"
            novalidate
            :aria-busy="pending"
            @submit="onSubmit($event, challenge)"
        >
            <div :class="arrangement.row">
                <UFormField
                    name="email"
                    :label="$t('newsletterForm.email.label')"
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
            <FormHoneypot v-model="website" />
            <UAlert
                v-if="status === 'error'"
                role="alert"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :title="$t('newsletterForm.error.title')"
                :description="$t('newsletterForm.error.description')"
            />
            <i18nT
                keypath="newsletterForm.notice"
                scope="global"
                tag="p"
                class="font-sans text-meta"
                :class="colors.notice"
            >
                <template #privacy>
                    <ULink
                        raw
                        :to="DESTINATIONS.privacy"
                        data-inline
                        class="underline underline-offset-2"
                    >
                        {{ $t("newsletterForm.privacy") }}
                    </ULink>
                </template>
            </i18nT>
        </UForm>
    </FormChallenge>
</template>
