<script setup lang="ts">
interface Props {
    notes: Note[];
}

defineProps<Props>();

const headingId = useId();
</script>

<template>
    <section v-if="notes.length" :aria-labelledby="headingId" class="border-t border-default pt-6">
        <h2 :id="headingId" class="text-kicker">
            {{ $t("articleNotes.title") }}
        </h2>
        <ol class="mt-4 flex flex-col gap-3">
            <li
                v-for="note in notes"
                :id="noteAnchor(note.id)"
                :key="note.id"
                class="grid grid-cols-[1.75rem_1fr] font-serif text-citation text-toned"
            >
                <ULink
                    :to="`#${noteReferenceAnchor(note.id)}`"
                    raw
                    :aria-label="$t('articleNotes.back', { number: note.id })"
                    class="-my-2.5 flex min-h-11 items-start pt-2.5 font-sans text-xs font-semibold leading-5 text-secondary hover:underline focus-visible:rounded-xs focus-visible:outline-offset-0"
                >
                    {{ note.id }}
                </ULink>
                <!-- eslint-disable vue/no-v-html -- only ever fed from the articles layer's sanitising body mapper -->
                <span class="break-words hl-links" v-html="note.html" />
                <!-- eslint-enable vue/no-v-html -->
            </li>
        </ol>
    </section>
</template>
