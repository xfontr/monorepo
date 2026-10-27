<script setup lang="ts">
definePageMeta({ name: "authors", path: "/colaboradores/" });

const { t } = useI18n();

const { authors } = await useAuthorDirectory();

const PRINCIPLES = ["rigour", "accessibility", "openAccess"] as const;

useSeoMeta({
    title: () => t("authors.title"),
    description: () => t("authors.about.title"),
});
</script>

<template>
    <div>
        <ArchiveIntro :breadcrumbs="[{ label: $t('authors.title') }]">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-12">
                <ArchiveHeading
                    :kicker="$t('authors.about.kicker')"
                    :title="$t('authors.about.title')"
                    class="lg:col-span-7"
                />
                <div
                    class="flex max-w-measure flex-col gap-5 font-serif text-reading text-toned lg:col-span-5 lg:pt-10"
                >
                    <p>{{ $t("authors.about.lead", { count: authors.length }) }}</p>
                    <p>{{ $t("authors.about.thanks") }}</p>
                    <div class="flex flex-col gap-3 pt-1 sm:flex-row">
                        <UButton
                            :label="$t('authors.about.publish')"
                            :to="{ name: 'publish' }"
                            class="justify-center"
                        />
                        <UButton
                            variant="outline"
                            color="neutral"
                            :label="$t('authors.about.contact')"
                            :to="DESTINATIONS.contact"
                            class="justify-center"
                        />
                    </div>
                </div>
            </div>
        </ArchiveIntro>

        <UContainer
            as="section"
            :aria-label="$t('authors.principles.label')"
            class="py-16 lg:py-20"
        >
            <ol class="grid gap-x-10 gap-y-8 lg:grid-cols-3">
                <li
                    v-for="(key, index) in PRINCIPLES"
                    :key
                    class="border-t-2 border-huella-slate-900 pt-4"
                >
                    <span
                        class="font-serif text-2xl leading-none text-huella-teal-600 tabular-nums"
                        aria-hidden="true"
                        >{{ index + 1 }}</span
                    >
                    <h2 class="mt-3 font-serif text-h3 text-highlighted">
                        {{ $t(`authors.principles.${key}.title`) }}
                    </h2>
                    <p class="mt-2 font-serif text-base leading-relaxed text-toned">
                        {{ $t(`authors.principles.${key}.body`) }}
                    </p>
                </li>
            </ol>
        </UContainer>

        <div class="border-t border-default bg-ivory-50">
            <UContainer class="py-16 lg:py-20">
                <DirectoryListing :authors />
            </UContainer>
        </div>
    </div>
</template>
