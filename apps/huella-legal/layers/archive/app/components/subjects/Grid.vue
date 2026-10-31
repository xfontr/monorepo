<script setup lang="ts">
interface Props {
    subjects: Facet<Category>[];
}

defineProps<Props>();
</script>

<template>
    <section aria-labelledby="areas">
        <h2 id="areas" class="scroll-mt-6 text-kicker text-muted">
            {{ $t("subjectsGrid.title") }}
        </h2>
        <ol class="mt-4 -mb-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            <li
                v-for="{ value, count } in subjects"
                :key="value.id"
                class="group relative flex flex-col gap-2 border-t border-default pt-5 pb-10"
            >
                <span class="font-sans text-meta text-muted tabular-nums">{{
                    $t("subjectsGrid.count", { count }, count)
                }}</span>
                <ULink
                    raw
                    :to="{ name: 'category', params: { slug: value.slug } }"
                    class="font-serif text-h3 text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
                    >{{ value.name }}</ULink
                >
                <p v-if="value.description" class="font-serif text-base/relaxed text-toned">
                    {{ value.description }}
                </p>
            </li>
        </ol>
    </section>
</template>
