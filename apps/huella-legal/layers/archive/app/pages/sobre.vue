<script setup lang="ts">
definePageMeta({ name: "about", path: "/sobre/" });

const VALUES = [
    { key: "rigour", icon: "i-lucide-scale" },
    { key: "clarity", icon: "i-lucide-book-open" },
    { key: "usefulness", icon: "i-lucide-graduation-cap" },
] as const;

const TOPICS = [
    { key: "criminal", icon: "i-lucide-gavel" },
    { key: "fundamentalRights", icon: "i-lucide-shield-check" },
    { key: "caseLaw", icon: "i-lucide-landmark" },
    { key: "more", icon: "i-lucide-library" },
] as const;

const MODEL = [
    { key: "freeToRead", icon: "i-lucide-lock-open" },
    { key: "openToWriters", icon: "i-lucide-pen-line" },
    { key: "independent", icon: "i-lucide-heart-handshake" },
] as const;

const { t } = useI18n();

useSeoMeta({
    title: () => t("about.title"),
    description: () => t("about.description"),
    ogType: "website",
});

const { index: subjectIndex } = await useSubjectIndex();
const { authors } = await useAuthorDirectory();

const articleCount = computed<number>(
    () => subjectIndex.value?.formats.reduce((total, { count }) => total + count, 0) ?? 0,
);
</script>

<template>
    <div>
        <AboutIntro :articles="articleCount" :authors="authors.length" />

        <section aria-labelledby="por-que-existimos" class="bg-huella-slate-900 text-ivory-50">
            <UContainer class="py-20 lg:py-28">
                <figure class="hl-about-reveal mx-auto max-w-4xl">
                    <p id="por-que-existimos" class="flex">
                        <BaseKicker tone="slate">{{ $t("aboutQuote.label") }}</BaseKicker>
                    </p>
                    <UIcon
                        name="i-lucide-quote"
                        class="mt-6 size-10 text-huella-teal-300 md:size-12"
                    />
                    <blockquote class="mt-6">
                        <p
                            class="font-serif text-section/snug text-balance italic md:text-[2.75rem]"
                        >
                            {{ $t("aboutQuote.text") }}
                        </p>
                    </blockquote>
                    <figcaption class="mt-6 font-sans text-meta text-huella-slate-200">
                        — {{ $t("aboutQuote.author") }}
                    </figcaption>
                </figure>
            </UContainer>
        </section>

        <UContainer as="section" class="py-16 lg:py-24">
            <BaseSectionHeading
                :kicker="$t('aboutValues.kicker')"
                :title="$t('aboutValues.title')"
            />
            <ul class="mt-10 grid gap-5 md:grid-cols-3">
                <UPageFeature
                    v-for="(value, index) in VALUES"
                    :key="value.key"
                    as="li"
                    :icon="value.icon"
                    :description="$t(`aboutValues.${value.key}.body`)"
                    :style="{ '--step': index }"
                    :ui="{
                        root: 'hl-about-reveal flex flex-col gap-4 bg-ivory-50 p-6 ring-1 ring-ivory-200',
                        leading:
                            'mb-0 size-12 rounded-full bg-huella-teal-50 ring-1 ring-huella-teal-100',
                        leadingIcon: 'size-6',
                        description: 'mt-4',
                    }"
                >
                    <template #title>
                        <h3 class="text-card">
                            {{ $t(`aboutValues.${value.key}.title`) }}
                        </h3>
                    </template>
                </UPageFeature>
            </ul>
        </UContainer>

        <div class="border-y border-default bg-ivory-50">
            <UContainer as="section" class="py-16 lg:py-24">
                <BaseSectionHeading
                    :kicker="$t('aboutTopics.kicker')"
                    :title="$t('aboutTopics.title')"
                    :action="{ label: $t('aboutTopics.action'), to: { name: 'categories' } }"
                />
                <ul class="mt-6 divide-y divide-default">
                    <UPageFeature
                        v-for="(topic, index) in TOPICS"
                        :key="topic.key"
                        as="li"
                        orientation="horizontal"
                        :icon="topic.icon"
                        :description="$t(`aboutTopics.${topic.key}.body`)"
                        :style="{ '--step': index }"
                        :ui="{
                            root: 'hl-about-reveal gap-5 py-6 md:items-center md:gap-10',
                            leading: 'mt-1 p-0 md:mt-0',
                            leadingIcon: 'size-7 md:size-8',
                            wrapper:
                                'md:grid md:flex-1 md:grid-cols-[minmax(0,18rem)_1fr] md:items-center md:gap-x-10',
                            description: 'md:mt-0',
                        }"
                    >
                        <template #title>
                            <h3 class="md:text-h3">
                                {{ $t(`aboutTopics.${topic.key}.title`) }}
                            </h3>
                        </template>
                    </UPageFeature>
                </ul>
            </UContainer>
        </div>

        <UPageSection
            orientation="horizontal"
            :title="$t('aboutTeam.title')"
            :ui="{ container: 'lg:items-start', wrapper: 'lg:col-span-5' }"
        >
            <template #headline>
                <BaseKicker>{{ $t("aboutTeam.kicker") }}</BaseKicker>
            </template>
            <div class="hl-about-reveal flex flex-col gap-6 lg:col-span-7">
                <p class="max-w-measure font-serif text-reading text-toned">
                    {{ $t("aboutTeam.lead") }}
                </p>
                <UButton
                    variant="outline"
                    color="neutral"
                    :label="$t('aboutTeam.action')"
                    trailing-icon="i-lucide-arrow-right"
                    :to="{ name: 'authors' }"
                    class="self-start"
                />
            </div>
        </UPageSection>

        <div class="border-t border-default bg-ivory-50">
            <UContainer as="section" class="py-16 lg:py-24">
                <BaseSectionHeading
                    :kicker="$t('aboutModel.kicker')"
                    :title="$t('aboutModel.title')"
                />
                <ul class="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
                    <UPageFeature
                        v-for="(item, index) in MODEL"
                        :key="item.key"
                        as="li"
                        :description="$t(`aboutModel.${item.key}.body`)"
                        :style="{ '--step': index }"
                        :ui="{
                            root: 'hl-about-reveal flex flex-col gap-4',
                            leading: 'mb-0 w-full gap-4',
                            description: 'mt-4 max-w-sm',
                        }"
                    >
                        <template #leading>
                            <span
                                class="grid size-14 shrink-0 place-items-center rounded-full bg-huella-teal-600 text-ivory-50"
                            >
                                <UIcon :name="item.icon" class="size-7" />
                            </span>
                            <span class="h-px flex-1 bg-huella-teal-200" aria-hidden="true" />
                        </template>
                        <template #title>
                            <h3 class="text-card">
                                {{ $t(`aboutModel.${item.key}.title`) }}
                            </h3>
                        </template>
                    </UPageFeature>
                </ul>
            </UContainer>
        </div>

        <AboutCallToAction />
        <NewsletterBand />
    </div>
</template>

<style>
@supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
        .hl-about-reveal {
            animation: hl-about-rise linear both;
            animation-timeline: view();
            animation-range: entry 0% entry 80%;
        }
    }
}

@keyframes hl-about-rise {
    from {
        opacity: 0;
        translate: 0 calc(1.5rem + var(--step, 0) * 1rem);
    }
}
</style>
