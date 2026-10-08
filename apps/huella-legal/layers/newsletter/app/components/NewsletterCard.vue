<script setup lang="ts">
import NewsletterForm from "./NewsletterForm.vue";

interface Props {
    subject?: string
    pending?: boolean
    error?: string
}

withDefaults(defineProps<Props>(), {
    pending: false,
});

const emit = defineEmits<{ submit: [email: string] }>();

</script>

<template>
    <div class="rounded-sm border border-default bg-ivory-50 p-5">
        <BaseKicker>{{ $t("newsletterCard.kicker") }}</BaseKicker>
        <p class="mt-2 font-serif text-lg leading-snug text-highlighted">
            {{ subject ? $t("newsletterCard.subjectLead", { subject }) : $t("newsletterCard.lead") }}
        </p>
        <NewsletterForm
            :pending
            :error
            class="mt-4"
            @submit="emit('submit', $event)"
        />
    </div>
</template>
