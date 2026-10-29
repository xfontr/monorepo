<script setup lang="ts">
definePageMeta({ name: "author", path: "/colaboradores/:slug/" });

const route = useRoute("author");

const { listing, status, sort, archiveTotal, pageLink } = await useArticleListing({
    author: route.params.slug,
});

const profile = computed(() =>
    listing.value?.scope?.kind === "author" ? listing.value.scope : undefined,
);

useSeoMeta({
    title: () => profile.value?.author.name,
    description: () => profile.value?.author.bio,
});
</script>

<template>
    <div v-if="listing && profile">
        <BasePageIntro
            :breadcrumbs="[
                { label: $t('author.collaborators'), to: { name: 'authors' } },
                { label: profile.author.name },
            ]"
        >
            <ArchiveAuthor :author="profile.author" :total="archiveTotal" :since="profile.since" />
        </BasePageIntro>
        <UContainer class="grid grid-cols-1 gap-12 pt-6 pb-16 lg:grid-cols-12 lg:gap-x-12 lg:pb-20">
            <ArchiveResults
                v-model:sort="sort"
                :listing
                :to="pageLink"
                :pending="status === 'pending'"
                :heading="$t('author.heading')"
                class="lg:col-span-8"
            />
            <ArchiveSubjects
                :title="$t('author.subjects')"
                :subjects="listing.subjects"
                class="lg:col-span-4"
            />
        </UContainer>
        <NewsletterBand />
    </div>
</template>
