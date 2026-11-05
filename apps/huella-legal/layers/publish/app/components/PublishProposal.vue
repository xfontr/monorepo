<template>
    <section :aria-labelledby="headingId">
        <h2 :id="headingId" class="font-serif text-section text-highlighted md:text-h2">
            {{ $t("publish.proposal.title") }}
        </h2>
        <I18nT
            keypath="publish.proposal.lead"
            scope="global"
            tag="p"
            class="mt-4 mb-8 font-serif text-base/relaxed text-toned"
        >
            <template #email>
                <ULink
                    :to="`mailto:${submissionEmail}`"
                    raw
                    class="font-semibold text-highlighted underline underline-offset-2"
                >
                    {{ submissionEmail }}
                </ULink>
            </template>
        </I18nT>
        <PublishForm />
    </section>
</template>

<script setup lang="ts">
const { submissionEmail } = useRuntimeConfig().public;

const headingId = useId();
</script>
