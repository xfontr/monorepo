<script setup lang="ts">
definePageMeta({ name: "publications", path: "/publicaciones/" });

const { t } = useI18n();

const { listing, status, sort, archiveTotal, formatPills, pageLink } = await useArticleListing();

const lead = computed<string>(() =>
    t("publications.lead", { subjects: listing.value?.subjects.length ?? 0 }),
);

useSeoMeta({ title: () => t("publications.title"), description: lead });
</script>

<template>
    <div v-if="listing">
        <ArchiveIntro :breadcrumbs="[{ label: $t('publications.title') }]">
            <ArchiveHeading
                :kicker="$t('publications.kicker', { count: archiveTotal }, archiveTotal)"
                :title="$t('publications.title')"
                :lead
                class="lg:w-7/12"
            />
        </ArchiveIntro>
        <UContainer class="grid grid-cols-1 gap-12 pt-6 pb-16 lg:grid-cols-12 lg:gap-x-12 lg:pb-20">
            <ArchiveResults
                v-model:sort="sort"
                :listing
                :to="pageLink"
                :format-pills
                :pending="status === 'pending'"
                class="lg:col-span-8"
            />
            <ArchiveSubjects
                :title="$t('publications.subjects')"
                :subjects="listing.subjects"
                class="lg:col-span-4"
            />
        </UContainer>
    </div>
</template>
