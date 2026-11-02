<script setup lang="ts">
const SUBJECTS = 8;

const titleId = useId();

const { data: home, status } = useCachedFetch<Home>("/api/home");

const subjects = computed<Facet<Category>[]>(
    () => home.value?.subjects.toSorted((a, b) => b.count - a.count).slice(0, SUBJECTS) ?? [],
);
</script>

<template>
    <div class="w-120 p-5">
        <p
            v-if="status === 'pending' || subjects.length"
            :id="titleId"
            class="text-kicker text-muted"
        >
            {{ $t("navSubjectsPanel.title") }}
        </p>
        <template v-if="status === 'pending'">
            <p class="sr-only">{{ $t("common.loading") }}</p>
            <ul aria-hidden="true" class="mt-2 grid grid-cols-2 gap-x-6">
                <li v-for="row in SUBJECTS" :key="row" class="flex min-h-10 items-center">
                    <USkeleton class="h-4 w-36" />
                </li>
            </ul>
        </template>
        <ul
            v-else-if="subjects.length"
            :aria-labelledby="titleId"
            class="mt-2 grid grid-cols-2 gap-x-6"
        >
            <li v-for="{ value, count } in subjects" :key="value.id">
                <ULink
                    raw
                    :to="{ name: 'category', params: { slug: value.slug } }"
                    class="flex min-h-10 items-baseline justify-between gap-3 py-2 font-serif text-base text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs"
                >
                    <span class="truncate">{{ value.name }}</span>
                    <span class="font-sans text-meta text-muted tabular-nums">
                        <span aria-hidden="true">{{ count }}</span>
                        <span class="sr-only">{{
                            $t("navSubjectsPanel.count", { count }, count)
                        }}</span>
                    </span>
                </ULink>
            </li>
        </ul>
        <div class="not-first:mt-3 not-first:border-t not-first:border-default not-first:pt-2">
            <ULink
                raw
                :to="{ name: 'categories' }"
                class="inline-flex min-h-10 items-center gap-1.5 font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-xs"
            >
                {{ $t("navSubjectsPanel.all") }}
                <UIcon name="i-lucide-arrow-right" class="size-4" />
            </ULink>
        </div>
    </div>
</template>
