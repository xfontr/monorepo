<script setup lang="ts">
interface Props {
    authors: Facet<Author>[];
}

const props = defineProps<Props>();

const PAGE_SIZE = 12;

const query = ref("");
const input = useTemplateRef("input");
const headingId = useId();

const trimmedQuery = computed<string>(() => query.value.trim());
const normalizedQuery = computed<string>(() => normalizeText(trimmedQuery.value));

const matches = computed<Facet<Author>[]>(() =>
    props.authors.filter(({ value }) => normalizeText(value.name).includes(normalizedQuery.value)),
);

// The reset button unmounts with the empty state, so focus goes back to the field
const reset = () => {
    query.value = "";
    input.value?.inputRef?.focus();
};
</script>

<template>
    <section :aria-labelledby="headingId">
        <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
                <h2 :id="headingId" class="font-serif text-section text-highlighted md:text-h2">
                    {{ $t("directoryListing.title") }}
                </h2>
                <p class="mt-1 font-sans text-meta text-muted">
                    {{ $t("directoryListing.count", authors.length) }}
                </p>
            </div>
            <UFormField :label="$t('directoryListing.filter.label')" class="w-full md:w-80">
                <UInput
                    ref="input"
                    v-model="query"
                    type="search"
                    icon="i-lucide-search"
                    :placeholder="$t('directoryListing.filter.placeholder')"
                    class="w-full"
                />
            </UFormField>
        </div>

        <p role="status" class="sr-only">
            {{ normalizedQuery ? $t("directoryListing.matches", matches.length) : "" }}
        </p>

        <Reveal
            v-if="matches.length"
            v-slot="{ items }"
            :items="matches"
            :limit="normalizedQuery ? Infinity : PAGE_SIZE"
            :label="$t('directoryListing.more', { count: matches.length })"
        >
            <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <li v-for="{ value, count } in items" :key="value.id">
                    <DirectoryCard :author="value" :count />
                </li>
            </ul>
        </Reveal>

        <UEmpty
            v-else
            icon="i-lucide-users"
            :title="$t('directoryListing.noMatch.title', { query: trimmedQuery })"
            :description="$t('directoryListing.noMatch.description')"
            :actions="[
                { label: $t('directoryListing.noMatch.reset'), variant: 'link', onClick: reset },
            ]"
            class="mt-8 border border-dashed border-accented"
        />
    </section>
</template>
