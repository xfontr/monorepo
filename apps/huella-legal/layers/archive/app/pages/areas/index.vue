<script setup lang="ts">
definePageMeta({ name: "categories", path: "/areas/" });

const { t } = useI18n();

const { index } = await useSubjectIndex();

const SECTIONS = { subjects: "#areas", formats: "#formatos", topics: "#temas" } as const;

useSeoMeta({ title: () => t("categories.title"), description: () => t("categories.lead") });
</script>

<template>
    <div v-if="index">
        <BasePageIntro :breadcrumbs="[{ label: $t('categories.title') }]">
            <BasePageHeading
                :kicker="$t('categories.kicker')"
                :title="$t('categories.title')"
                :lead="$t('categories.lead')"
            />
            <nav
                :aria-label="$t('categories.sections.label')"
                class="mt-5 -ml-3 flex flex-wrap font-sans text-sm font-semibold"
            >
                <ULink
                    v-for="(hash, key) in SECTIONS"
                    :key
                    raw
                    :to="{ hash }"
                    class="inline-flex min-h-11 items-center px-3 text-primary underline-offset-4 hover:underline focus-visible:rounded-xs"
                    >{{
                        $t(
                            `categories.sections.${key}`,
                            { count: index[key].length },
                            index[key].length,
                        )
                    }}</ULink
                >
            </nav>
        </BasePageIntro>

        <UContainer class="py-16 lg:py-20">
            <SubjectsGrid :subjects="index.subjects" />
        </UContainer>

        <SubjectsFormats :formats="index.formats" />

        <UContainer class="py-16 lg:py-20">
            <SubjectsTopics :topics="index.topics" />
        </UContainer>
    </div>
</template>
