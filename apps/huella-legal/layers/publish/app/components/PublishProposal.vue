<script setup lang="ts">
const CHECKLIST = ["name", "kind", "title", "summary", "file"] as const;

const { t } = useI18n();
const { submissionEmail } = useRuntimeConfig().public;

const headingId = useId();

// Not URLSearchParams, whose `+` for a space several mail clients show literally
const mailto = computed<string>(() => {
    const subject = encodeURIComponent(t("publish.proposal.mail.subject"));
    // RFC 6068 wants CRLF line breaks in a body
    const body = encodeURIComponent(t("publish.proposal.mail.body").replaceAll("\n", "\r\n"));

    return `mailto:${submissionEmail}?subject=${subject}&body=${body}`;
});
</script>

<template>
    <section :aria-labelledby="headingId">
        <h2 :id="headingId" class="font-serif text-section text-highlighted md:text-h2">
            {{ $t("publish.proposal.title") }}
        </h2>
        <I18nT
            keypath="publish.proposal.lead"
            scope="global"
            tag="p"
            class="mt-4 font-serif text-base/relaxed text-toned"
        >
            <template #email>
                <ULink
                    :to="mailto"
                    raw
                    class="font-semibold text-highlighted underline underline-offset-2"
                >
                    {{ submissionEmail }}
                </ULink>
            </template>
        </I18nT>
        <ul class="mt-4 flex flex-col gap-3">
            <li
                v-for="item in CHECKLIST"
                :key="item"
                class="flex gap-3 font-serif text-base text-toned"
            >
                <UIcon name="i-lucide-check" class="mt-1 size-5 shrink-0 text-secondary" />
                {{ $t(`publish.proposal.checklist.${item}`) }}
            </li>
        </ul>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <UButton
                :to="mailto"
                icon="i-lucide-mail"
                :label="$t('publish.proposal.send')"
                class="justify-center"
            />
            <p class="font-sans text-meta text-muted">{{ $t("publish.proposal.reply") }}</p>
        </div>
        <I18nT
            keypath="publish.proposal.privacy"
            scope="global"
            tag="p"
            class="mt-6 font-sans text-meta text-muted"
        >
            <template #policy>
                <ULink raw :to="DESTINATIONS.privacy" class="underline underline-offset-2">
                    {{ $t("publish.proposal.policy") }}
                </ULink>
            </template>
        </I18nT>
    </section>
</template>
