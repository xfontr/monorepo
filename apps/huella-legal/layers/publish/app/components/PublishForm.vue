<template>
    <FormSuccessPanel v-if="status === 'success'" :title="$t('publishForm.success.title')">
        {{ $t("publishForm.success.description") }}
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
            @submit="onSubmit($event.data, challenge)"
            @error="onError($event.errors)"
        >
            <FormErrorSummary :errors="summaryErrors" />
            <UAlert
                v-if="status === 'error'"
                role="alert"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :title="$t('publishForm.error.title')"
                :description="$t('publishForm.error.description')"
            />
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <UFormField name="name" :label="$t('publishForm.name.label')" required>
                    <UInput v-model="state.name" type="text" autocomplete="name" class="w-full" />
                </UFormField>
                <UFormField name="email" :label="$t('publishForm.email.label')" required>
                    <UInput
                        v-model="state.email"
                        type="email"
                        autocomplete="email"
                        :placeholder="$t('publishForm.email.placeholder')"
                        class="w-full"
                    />
                </UFormField>
                <UFormField name="kind" :label="$t('publishForm.kind.label')" required>
                    <USelect v-model="state.kind" :items="kinds" class="w-full" />
                </UFormField>
                <UFormField name="title" :label="$t('publishForm.title.label')">
                    <UInput v-model="state.title" class="w-full" />
                </UFormField>
            </div>
            <UFormField
                name="summary"
                :label="$t('publishForm.summary.label')"
                :help="$t('publishForm.summary.help')"
                required
            >
                <UTextarea v-model="state.summary" :rows="4" autoresize class="w-full" />
            </UFormField>
            <UFormField
                name="file"
                :label="$t('publishForm.file.label')"
                :help="$t('publishForm.file.help')"
            >
                <UFileUpload
                    v-model="state.file"
                    :label="$t('publishForm.file.upload')"
                    :description="$t('publishForm.file.description')"
                    icon="i-lucide-file-text"
                    :accept="ACCEPT"
                    class="w-full"
                />
            </UFormField>
            <FormHoneypot v-model="honeypot" />
            <UFormField name="consent">
                <UCheckbox
                    v-model="state.consent"
                    :label="$t('publishForm.consent.label')"
                    required
                />
            </UFormField>
            <I18nT
                keypath="publishForm.notice"
                scope="global"
                tag="p"
                class="font-sans text-meta text-muted"
            >
                <template #privacy>
                    <ULink raw :to="nav.privacy" class="underline underline-offset-2">
                        {{ $t("publishForm.privacy") }}
                    </ULink>
                </template>
            </I18nT>
            <UButton
                type="submit"
                :loading="submitting"
                :label="$t('publishForm.submit')"
                class="justify-center md:self-start"
            />
        </UForm>
    </FormChallenge>
</template>

<script setup lang="ts">
import { useFormSubmission } from "#layers/forms/app/composables/useFormSubmission";
import type { Form, SelectItem } from "@nuxt/ui";
import {
    MANUSCRIPT_TYPES,
    SUBMISSION_KINDS,
    type Submission,
    type SubmissionIssue,
    submissionSchema,
} from "../../shared/schemas/submission";
import { useSubmission } from "../composables/useSubmission";

const { t } = useI18n();
const { nav } = useAppConfig();
const { status, errors, send } = useSubmission();

const issueMessage = (issue: SubmissionIssue): string => t(`publishForm.errors.${issue}`);
const schema = submissionSchema(issueMessage);

const ACCEPT = MANUSCRIPT_TYPES.join(",");

const kinds = computed<SelectItem[]>(() =>
    SUBMISSION_KINDS.map((kind) => ({ value: kind, label: t(`publishForm.kind.items.${kind}`) })),
);

const state = reactive<Omit<Submission, "file"> & { file: File | null }>({
    name: "",
    email: "",
    kind: "article",
    title: "",
    summary: "",
    file: null,
    consent: false,
});

const form = useTemplateRef<Form<typeof schema>>("form");

const { honeypot, submitting, validateOn, summaryErrors, submit, onError } = useFormSubmission(
    form,
    {
        status,
        errors,
        send,
        message: issueMessage,
        label: (field) => t(`publishForm.${field}.name`),
    },
);

// The schema keeps only the file's name and size, and `state.file` is a proxy FormData refuses
const onSubmit = (data: Submission, challenge: Challenge) =>
    submit({ ...data, file: toRaw(state.file) }, challenge);
</script>
