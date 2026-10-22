<script setup lang="ts">
import NewsletterForm from "./NewsletterForm.vue";

interface Props {
    subject?: string;
}

defineProps<Props>();
</script>

<template>
    <div class="rounded-sm border border-default bg-ivory-50 p-5">
        <BaseKicker>{{ $t("newsletterCard.kicker") }}</BaseKicker>
        <p class="mt-2 font-serif text-lg leading-snug text-highlighted">
            {{
                subject ? $t("newsletterCard.subjectLead", { subject }) : $t("newsletterCard.lead")
            }}
        </p>
        <NewsletterForm class="mt-4" />
    </div>
</template>
