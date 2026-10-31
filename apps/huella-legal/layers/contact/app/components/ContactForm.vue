<script setup lang="ts">
import { useFormSubmission } from "#layers/forms/app/composables/useFormSubmission";
import type { Form } from "@nuxt/ui";
import { DESTINATIONS } from "~/composables/useSiteNav";
import { type Contact, type ContactIssue, contactSchema } from "../../shared/schemas/contact";
import { useContact } from "../composables/useContact";

const { t } = useI18n();
const { status, errors, send } = useContact();

const issueMessage = (issue: ContactIssue): string => t(`contactForm.errors.${issue}`);
const schema = contactSchema(issueMessage);

const state = reactive<Contact>({ name: "", email: "", message: "", consent: false });

const form = useTemplateRef<Form<typeof schema>>("form");

const { honeypot, submitting, validateOn, summaryErrors, submit, onError } = useFormSubmission(
    form,
    {
        status,
        errors,
        send,
        message: issueMessage,
        label: (field) => t(`contactForm.${field}.name`),
    },
);
</script>

<template>
    <FormSuccessPanel v-if="status === 'success'" :title="$t('contactForm.success.title')">
        {{ $t("contactForm.success.description") }}
    </FormSuccessPanel>
    <FormChallenge v-else v-slot="{ challenge }">
        <UForm
            ref="form"
            :schema
            :state
            :validate-on
            :disabled="submitting"
            :aria-busy="submitting"
            novalidate
            class="flex flex-col gap-6"
            @submit="submit($event.data, challenge)"
            @error="onError($event.errors)"
        >
            <FormErrorSummary :errors="summaryErrors" />
            <UAlert
                v-if="status === 'error'"
                role="alert"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :title="$t('contactForm.error.title')"
                :description="$t('contactForm.error.description')"
            />
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <UFormField name="name" :label="$t('contactForm.name.label')" required>
                    <UInput v-model="state.name" autocomplete="name" class="w-full" />
                </UFormField>
                <UFormField name="email" :label="$t('contactForm.email.label')" required>
                    <UInput
                        v-model="state.email"
                        type="email"
                        autocomplete="email"
                        :placeholder="$t('contactForm.email.placeholder')"
                        class="w-full"
                    />
                </UFormField>
            </div>
            <UFormField name="message" :label="$t('contactForm.message.label')" required>
                <UTextarea v-model="state.message" :rows="6" autoresize class="w-full" />
            </UFormField>
            <FormHoneypot v-model="honeypot" />
            <UFormField name="consent">
                <UCheckbox
                    v-model="state.consent"
                    :label="$t('contactForm.consent.label')"
                    required
                />
            </UFormField>
            <I18nT
                keypath="contactForm.notice"
                scope="global"
                tag="p"
                class="font-sans text-meta text-muted"
            >
                <template #privacy>
                    <ULink
                        raw
                        :to="DESTINATIONS.privacy"
                        data-inline
                        class="underline underline-offset-2"
                    >
                        {{ $t("contactForm.privacy") }}
                    </ULink>
                </template>
            </I18nT>
            <UButton
                type="submit"
                :loading="submitting"
                :label="$t('contactForm.submit')"
                class="justify-center md:self-start"
            />
        </UForm>
    </FormChallenge>
</template>
