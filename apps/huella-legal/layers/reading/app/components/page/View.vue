<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";

const { page } = await usePage();

const { t } = useI18n();

const breadcrumb = computed<BreadcrumbItem[]>(() => [
    { label: t("page.breadcrumb.home"), to: { name: "index" } },
    { label: page.value?.title },
]);
</script>

<template>
    <article v-if="page">
        <ArticleTitle :breadcrumb :title="page.title" />

        <UContainer
            class="grid grid-cols-1 pt-10 pb-16 md:pt-12 lg:grid-cols-12 lg:gap-x-8 lg:pb-20"
        >
            <ArticleToc
                :items="page.body.toc"
                :title="$t('page.toc')"
                class="mb-10 lg:col-span-3 lg:mb-0"
            />

            <div class="min-w-0 lg:col-span-9 lg:col-start-4">
                <ArticleProse :lead="page.body.lead" :html="page.body.html" />
                <div
                    v-if="page.body.notes.length || page.body.bibliography.length"
                    class="mt-12 flex max-w-measure flex-col gap-12 lg:mt-16"
                >
                    <ArticleNotes :notes="page.body.notes" />
                    <ArticleBibliography :entries="page.body.bibliography" />
                </div>
            </div>
        </UContainer>
    </article>
</template>
