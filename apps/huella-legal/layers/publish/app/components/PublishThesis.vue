<template>
    <section
        :aria-labelledby="headingId"
        class="rounded-sm bg-inverted p-6 text-default surface-inverted"
    >
        <span
            class="flex size-11 items-center justify-center rounded-full bg-elevated text-secondary"
        >
            <UIcon name="i-lucide-graduation-cap" class="size-5" />
        </span>
        <h2 :id="headingId" class="mt-4 font-serif text-h3 text-highlighted">
            {{ $t("publish.thesis.title") }}
        </h2>
        <p class="mt-2 font-serif text-base/relaxed">{{ $t("publish.thesis.body") }}</p>
        <UButton
            variant="link"
            color="neutral"
            :label="$t('publish.thesis.action')"
            trailing-icon="i-lucide-arrow-right"
            :to="{ name: 'publications', query: { format: 'tfg-tfm' } }"
            class="mt-2 -ml-3 text-huella-teal-200 hover:text-highlighted"
        />
    </section>
</template>

<script setup lang="ts">
const headingId = useId();
</script>
