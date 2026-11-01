<script setup lang="ts">
definePageMeta({ name: "search", path: "/buscar/" });

const { t } = useI18n();

const { search, term, status, pageLink } = await useArticleSearch();

const title = computed<string>(() =>
    term.value ? t("search.title.query", { query: term.value }) : t("search.title.blank"),
);

useSeoMeta({ title });
</script>

<template>
    <UContainer class="py-10 md:py-14">
        <div class="flex max-w-3xl flex-col gap-6">
            <h1 class="sr-only">{{ title }}</h1>
            <SearchForm v-model="term" />
            <SearchResults v-if="term" :search :to="pageLink" :pending="status === 'pending'" />
            <p v-else class="font-serif text-base/relaxed text-toned">
                {{ $t("search.empty") }}
            </p>
        </div>
    </UContainer>
</template>
