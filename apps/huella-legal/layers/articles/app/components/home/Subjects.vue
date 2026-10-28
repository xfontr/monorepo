<script setup lang="ts">
import { FORMAT_KEYS } from "#layers/articles/app/constants";

interface Props {
    subjects: Facet<Category>[];
    formats: Facet<ArticleSummary["format"]>[];
}

defineProps<Props>();

const titleId = useId();
</script>

<template>
    <UPageSection
        orientation="horizontal"
        :aria-labelledby="titleId"
        :description="$t('homeSubjects.lead', { count: subjects.length }, subjects.length)"
        :ui="{ description: 'max-w-sm' }"
        class="border-y border-default bg-ivory-50"
    >
        <template #headline>
            <BaseKicker>{{ $t("homeSubjects.kicker") }}</BaseKicker>
        </template>
        <template #title>
            <span :id="titleId">{{ $t("homeSubjects.title") }}</span>
        </template>
        <template #links>
            <UButton
                variant="outline"
                color="neutral"
                :label="$t('homeSubjects.all')"
                :to="{ name: 'categories' }"
            />
        </template>
        <div class="lg:col-span-8">
            <ul class="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-8">
                <li
                    v-for="{ value, count } in subjects"
                    :key="value.id"
                    class="border-b border-(--ui-border-muted)"
                >
                    <ULink
                        raw
                        :to="{ name: 'category', params: { slug: value.slug } }"
                        class="group flex min-h-14 items-baseline gap-3 py-3 focus-visible:rounded-xs xl:gap-2"
                    >
                        <span
                            class="font-serif text-lg text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline xl:text-base"
                            >{{ value.name }}</span
                        >
                        <span
                            class="flex-1 translate-y-[-0.2em] border-b border-dotted border-ivory-400"
                            aria-hidden="true"
                        />
                        <span class="font-sans text-meta tabular-nums text-muted">
                            <span aria-hidden="true">{{ count }}</span>
                            <span class="sr-only">{{
                                $t("homeSubjects.count", { count }, count)
                            }}</span>
                        </span>
                    </ULink>
                </li>
            </ul>
            <nav
                v-if="formats.length > 1"
                :aria-label="$t('homeSubjects.formats.label')"
                class="mt-6 -ml-2 flex flex-wrap items-center gap-x-1 font-sans text-sm"
            >
                <span class="mr-2 pl-2 text-muted">{{ $t("homeSubjects.formats.prompt") }}</span>
                <ULink
                    v-for="{ value } in formats"
                    :key="value"
                    raw
                    :to="{ name: 'publications', query: { format: value } }"
                    class="inline-flex min-h-11 items-center px-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-xs"
                    >{{ $t(`homeSubjects.formats.${FORMAT_KEYS[value]}`) }}</ULink
                >
            </nav>
        </div>
    </UPageSection>
</template>
