<script setup lang="ts">
const { home } = await useHome();

useHead({ titleTemplate: "%s" });

const recentId = useId();
</script>

<template>
    <div v-if="home" class="flex flex-col">
        <UContainer>
            <div
                class="flex flex-col gap-4 border-b border-default pt-10 pb-8 md:pt-14 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-10"
            >
                <I18nT
                    keypath="home.hero.title"
                    tag="h1"
                    scope="global"
                    class="max-w-3xl font-serif text-[2.125rem] leading-[1.08] tracking-[-0.02em] text-balance text-highlighted md:text-[3rem] lg:text-[3.5rem]"
                >
                    <template #emphasis>
                        <em class="text-primary">{{ $t("home.hero.emphasis") }}</em>
                    </template>
                </I18nT>
                <p class="max-w-sm font-serif text-base/relaxed text-muted lg:pb-2 lg:text-right">
                    {{ $t("home.hero.lead") }}
                </p>
            </div>
        </UContainer>

        <HomeFeatured v-if="home.lead" :lead="home.lead" :latest="home.latest" />

        <UContainer as="section" :aria-labelledby="recentId" class="pb-16 lg:pb-20">
            <BaseSectionHeading
                :id="recentId"
                :title="$t('home.recent.title')"
                :action="{ label: $t('home.recent.all'), to: { name: 'publications' } }"
            />
            <SummaryGrid :articles="home.recent" hide-orphan class="mt-8" />
        </UContainer>

        <HomeSubjects :subjects="home.subjects" :formats="home.formats" />

        <HomeTheses :articles="home.theses" />

        <UContainer as="section" :aria-label="$t('home.publish.label')" class="py-16 lg:py-20">
            <div
                class="flex flex-col gap-4 border-t-2 border-huella-slate-900 pt-5 md:flex-row md:items-center md:justify-between md:gap-10"
            >
                <p class="max-w-3xl font-serif text-xl/snug text-highlighted md:text-h3">
                    {{ $t("home.publish.prompt") }}
                </p>
                <UButton
                    variant="outline"
                    color="neutral"
                    :label="$t('home.publish.action')"
                    trailing-icon="i-lucide-arrow-right"
                    :to="{ name: 'publish' }"
                    class="shrink-0 self-start md:self-auto"
                />
            </div>
        </UContainer>

        <NewsletterBand />
    </div>
</template>
