<script setup lang="ts">
import { useFormSubmission } from "#layers/forms/app/composables/useFormSubmission";
import type { Form, FormErrorWithId } from "@nuxt/ui";
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
    stacked: { row: "flex flex-col gap-3", block: true },
    inline: { row: "flex flex-col gap-3 sm:flex-row", block: false },
} as const satisfies Record<Layout, LayoutRecipe>;

const SHAKE: Keyframe[] = [0, -6, 6, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` }));

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
const { status, errors, send } = useNewsletter();

const issueMessage = (issue: SubscriptionIssue): string =>
    t(`newsletterForm.email.errors.${issue}`);
const schema = subscriptionSchema(issueMessage);

const state = reactive<Subscription>({ email: "" });

const form = useTemplateRef<Form<typeof schema>>("form");
const email = useTemplateRef<{ inputRef?: HTMLInputElement | null }>("email");

const { honeypot, submitted, submitting, validateOn, submit, onError } = useFormSubmission(form, {
    status,
    errors,
    send,
    message: issueMessage,
});

const announcement = ref<string>("");

const onInvalid = async (formErrors: readonly FormErrorWithId[]): Promise<void> => {
    const required = issueMessage("required");
    const empty = formErrors.length > 0 && formErrors.every(({ message }) => message === required);
    const input = empty ? email.value?.inputRef : null;

    if (!input || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        onError(formErrors);
        return;
    }

    submitted.value = false;
    form.value?.clear();
    input.focus();
    input.animate(SHAKE, { duration: 320, easing: "ease-in-out" });

    announcement.value = "";
    await nextTick();
    announcement.value = required;
};

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
            :validate-on
            :disabled="submitting"
            class="flex flex-col gap-3"
            novalidate
            :aria-busy="submitting"
            @submit="submit($event.data, challenge)"
            @error="onInvalid($event.errors)"
        >
            <UFormField
                name="email"
                :label="$t('newsletterForm.email.label')"
                :ui="{ label: colors.label, error: colors.error }"
                eager-validation
            >
                <div :class="arrangement.row">
                    <UInput
                        ref="email"
                        v-model="state.email"
                        type="email"
                        autocomplete="email"
                        :placeholder="$t('newsletterForm.email.placeholder')"
                        class="w-full"
                    />
                    <UButton
                        type="submit"
                        :block="arrangement.block"
                        :loading="submitting"
                        :label="$t('newsletterForm.submit')"
                        :color="colors.button"
                        class="shrink-0 justify-center"
                    />
                </div>
            </UFormField>
            <FormHoneypot v-model="honeypot" />
            <UAlert
                v-if="status === 'error'"
                role="alert"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :title="$t('newsletterForm.error.title')"
                :description="$t('newsletterForm.error.description')"
            />
            <I18nT
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
            </I18nT>
            <p class="sr-only" aria-live="polite">{{ announcement }}</p>
        </UForm>
    </FormChallenge>
</template>
