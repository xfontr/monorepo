<script setup lang="ts">
definePageMeta({ name: "tag", path: "/etiquetas/:slug/" });

const route = useRoute("tag");

const { listing, status, sort, archiveTotal, pageLink } = await useArticleListing({
    tag: route.params.slug,
});

const term = computed(() =>
    listing.value?.scope?.kind === "tag" ? listing.value.scope.term : undefined,
);

useSeoMeta({ title: () => term.value?.name, description: () => term.value?.description });
</script>

<template>
    <div v-if="listing && term">
        <ArchiveIntro
            :breadcrumbs="[
                { label: $t('publications.title'), to: { name: 'publications' } },
                { label: term.name },
            ]"
        >
            <ArchiveHeading
                :kicker="$t('tag.kicker', { count: archiveTotal }, archiveTotal)"
                :title="term.name"
                :lead="term.description"
                class="lg:w-7/12"
            />
        </ArchiveIntro>
        <UContainer class="grid grid-cols-1 gap-12 pt-6 pb-16 lg:grid-cols-12 lg:gap-x-12 lg:pb-20">
            <ArchiveResults
                v-model:sort="sort"
                :listing
                :to="pageLink"
                :pending="status === 'pending'"
                class="lg:col-span-8"
            />
            <ArchiveSubjects
                :title="$t('tag.subjects')"
                :subjects="listing.subjects"
                archive-link
                class="lg:col-span-4"
            />
        </UContainer>
        <NewsletterBand />
    </div>
</template>
