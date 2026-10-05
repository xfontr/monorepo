<script setup lang="ts">
interface Props {
    entries: string[]
}

defineProps<Props>();

const headingId = useId();
</script>

<template>
    <section
        v-if="entries.length"
        :aria-labelledby="headingId"
        class="border-t border-default pt-6"
    >
        <h2
            :id="headingId"
            class="text-kicker"
        >
            {{ $t("articleBibliography.title") }}
        </h2>
        <ul class="mt-4 flex flex-col gap-3">
            <!-- eslint-disable vue/no-v-html -- only ever fed from the articles layer's sanitising body mapper -->
            <li
                v-for="(entry, index) in entries"
                :key="index"
                class="pl-6 -indent-6 font-serif text-citation break-words text-toned [&_a]:text-primary [&_a]:underline [&_a]:decoration-huella-slate-300 [&_a]:underline-offset-2 [&_a:hover]:decoration-current"
                v-html="entry"
            />
            <!-- eslint-enable vue/no-v-html -->
        </ul>
    </section>
</template>
