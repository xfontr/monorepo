<script setup lang="ts">
definePageMeta({ name: "category", path: "/areas/:slug/" });

const route = useRoute("category");

const { listing, status, sort, archiveTotal, pageLink } = await useArticleListing({
    category: route.params.slug,
});

const term = computed(() =>
    listing.value?.scope?.kind === "category" ? listing.value.scope.term : undefined,
);

// The card's lead runs the name mid-sentence
const subject = computed(() => term.value?.name.toLocaleLowerCase("es"));

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
                :kicker="$t('category.kicker', { count: archiveTotal }, archiveTotal)"
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
                :empty-subject="term.name"
                class="lg:col-span-8"
            />
            <div class="flex flex-col gap-10 lg:col-span-4">
                <ArchiveSubjects
                    :title="$t('category.subjects')"
                    :subjects="listing.subjects"
                    :current-subject="term.id"
                    archive-link
                />
                <NewsletterCard :subject />
            </div>
        </UContainer>
    </div>
</template>
