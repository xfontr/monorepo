<script setup lang="ts">
import { useErrorSummary } from "#layers/forms/app/composables/useErrorSummary";
import { useFormSubmission } from "#layers/forms/app/composables/useFormSubmission";
import type { ButtonProps, Form, FormErrorWithId } from "@nuxt/ui";
import { DESTINATIONS } from "~/composables/useSiteNav";
import {
    type CommentFields,
    type CommentIssue,
    commentSchema,
    MAX_COMMENT_LENGTH,
} from "../../shared/schemas/comment";
import { usePostComment } from "../composables/usePostComment";

interface Props {
    postId: string;
    replyTo?: ReaderComment;
}

const props = defineProps<Props>();

const emit = defineEmits<{ cancelReply: [] }>();

const { t } = useI18n();
const { status, errors, failure, send } = usePostComment();

const issueMessage = (issue: CommentIssue): string => t(`commentForm.errors.${issue}`);
const schema = commentSchema(issueMessage);

const state = reactive<CommentFields>({ name: "", email: "", content: "", consent: false });

const replyingTo = computed<string>(() =>
    t("commentForm.replyingTo", { author: props.replyTo?.author || t("commentItem.anonymous") }),
);
const replyActions = computed<ButtonProps[]>(() => [
    {
        label: t("commentForm.cancelReply"),
        variant: "link",
        color: "neutral",
        onClick: () => emit("cancelReply"),
    },
]);

const form = useTemplateRef<Form<typeof schema>>("form");
const content = useTemplateRef<{ textareaRef?: HTMLTextAreaElement | null }>("content");

const { honeypot, submitting, validateOn, submit, onInvalid } = useFormSubmission(form, {
    status,
    errors,
    send,
    message: issueMessage,
});

const { errors: summaryErrors, list: listInSummary } = useErrorSummary((field) =>
    t(`commentForm.${field}.name`),
);

const onError = (formErrors: readonly FormErrorWithId[]): void => {
    onInvalid();
    listInSummary(formErrors);
};

const onSubmit = async (fields: CommentFields, challenge: Challenge): Promise<void> => {
    listInSummary([]);
    listInSummary(
        await submit(
            { ...fields, post: props.postId, parent: props.replyTo?.id ?? "0" },
            challenge,
        ),
    );
};

watch(
    () => props.replyTo,
    (comment) => {
        if (comment) content.value?.textareaRef?.focus();
    },
    { flush: "post" },
);
</script>

<template>
    <FormSuccessPanel v-if="status === 'success'" :title="$t('commentForm.success.title')">
        {{ $t("commentForm.success.description") }}
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
                :title="$t('commentForm.error.title')"
                :description="$t(`commentForm.error.${failure}`)"
            />
            <UAlert
                v-if="replyTo"
                color="neutral"
                variant="soft"
                orientation="horizontal"
                :title="replyingTo"
                :actions="replyActions"
            />
            <UFormField name="content" :label="$t('commentForm.content.label')" required>
                <UTextarea
                    ref="content"
                    v-model="state.content"
                    :rows="5"
                    :maxlength="MAX_COMMENT_LENGTH"
                    autoresize
                    class="w-full"
                />
            </UFormField>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <UFormField
                    name="name"
                    :label="$t('commentForm.name.label')"
                    :hint="$t('commentForm.name.hint')"
                    required
                >
                    <UInput v-model="state.name" autocomplete="name" class="w-full" />
                </UFormField>
                <UFormField
                    name="email"
                    :label="$t('commentForm.email.label')"
                    :hint="$t('commentForm.email.hint')"
                    required
                >
                    <UInput
                        v-model="state.email"
                        type="email"
                        autocomplete="email"
                        :placeholder="$t('commentForm.email.placeholder')"
                        class="w-full"
                    />
                </UFormField>
            </div>
            <FormHoneypot v-model="honeypot" />
            <UFormField name="consent">
                <UCheckbox
                    v-model="state.consent"
                    :label="$t('commentForm.consent.label')"
                    required
                />
            </UFormField>
            <I18nT
                keypath="commentForm.notice"
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
                        {{ $t("commentForm.privacy") }}
                    </ULink>
                </template>
            </I18nT>
            <UButton
                type="submit"
                :loading="submitting"
                :label="$t('commentForm.submit')"
                class="justify-center md:self-start"
            />
        </UForm>
    </FormChallenge>
</template>
