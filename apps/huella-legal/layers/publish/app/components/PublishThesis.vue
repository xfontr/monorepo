<script setup lang="ts">
const headingId = useId();
</script>

<template>
    <section
        :aria-labelledby="headingId"
        class="rounded-sm bg-huella-slate-900 p-6 text-huella-slate-200"
    >
        <span
            class="flex size-11 items-center justify-center rounded-full bg-huella-slate-800 text-huella-teal-300"
        >
            <UIcon name="i-lucide-graduation-cap" class="size-5" />
        </span>
        <h2 :id="headingId" class="mt-4 font-serif text-h3 text-ivory-50">
            {{ $t("publish.thesis.title") }}
        </h2>
        <p class="mt-2 font-serif text-base/relaxed">{{ $t("publish.thesis.body") }}</p>
        <UButton
            variant="link"
            color="neutral"
            :label="$t('publish.thesis.action')"
            trailing-icon="i-lucide-arrow-right"
            :to="{ name: 'publications', query: { format: 'tfg-tfm' } }"
            class="mt-2 -ml-3 text-huella-teal-200 hover:text-ivory-50"
        />
    </section>
</template>
