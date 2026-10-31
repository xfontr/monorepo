<script setup lang="ts">
definePageMeta({ name: "publications", path: "/publicaciones/" });

const { t } = useI18n();

const { listing, status, sort, search, archiveTotal, formatPills, pageLink } =
    await useArticleListing();

const lead = computed<string>(() =>
    t("publications.lead", { subjects: listing.value?.subjects.length ?? 0 }),
);

useSeoMeta({ title: () => t("publications.title"), description: lead });
</script>

<template>
    <div v-if="listing">
        <BasePageIntro :breadcrumbs="[{ label: $t('publications.title') }]">
            <div class="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
                <BasePageHeading
                    :kicker="$t('publications.kicker', { count: archiveTotal }, archiveTotal)"
                    :title="$t('publications.title')"
                    :lead
                    class="lg:col-span-7"
                />
                <SearchForm
                    v-model="search"
                    :action="$router.resolve({ name: 'publications' }).href"
                    :label="$t('archiveSearch.label')"
                    :placeholder="$t('archiveSearch.placeholder')"
                    class="lg:col-span-5"
                />
            </div>
        </BasePageIntro>
        <UContainer class="grid grid-cols-1 gap-12 pt-6 pb-16 lg:grid-cols-12 lg:gap-x-12 lg:pb-20">
            <ArchiveResults
                v-model:sort="sort"
                :listing
                :to="pageLink"
                :format-pills
                :pending="status === 'pending'"
                :query="search"
                class="lg:col-span-8"
            />
            <ArchiveSubjects
                :title="$t('publications.subjects')"
                :subjects="listing.subjects"
                class="lg:col-span-4"
            />
        </UContainer>
        <NewsletterBand />
    </div>
</template>
