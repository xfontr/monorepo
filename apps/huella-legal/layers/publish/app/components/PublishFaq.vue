<script setup lang="ts">
import type { AccordionItem } from "@nuxt/ui";

const QUESTIONS = ["length", "topics", "format", "changes", "advertising"] as const;

const { t } = useI18n();

const headingId = useId();

const items = computed<AccordionItem[]>(() =>
    QUESTIONS.map((key) => ({
        value: key,
        label: t(`publish.faq.items.${key}.question`),
        content: t(`publish.faq.items.${key}.answer`),
    })),
);
</script>

<template>
    <section :aria-labelledby="headingId" class="border-t-2 border-huella-slate-900 pt-4">
        <h2 :id="headingId" class="font-serif text-h3 text-highlighted">
            {{ $t("publish.faq.title") }}
        </h2>
        <UAccordion :items :default-value="QUESTIONS[0]" :unmount-on-hide="false" class="mt-2" />
    </section>
</template>
