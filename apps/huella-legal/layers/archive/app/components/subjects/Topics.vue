<script setup lang="ts">
interface Props {
    topics: Facet<Category>[];
}

const props = defineProps<Props>();

const letters = computed(() => groupByLetter(props.topics, ({ value }) => value.name));
</script>

<template>
    <section aria-labelledby="temas">
        <h2 id="temas" class="scroll-mt-6 text-kicker text-muted">
            {{ $t("subjectsTopics.title") }}
        </h2>
        <p class="mt-2 max-w-measure font-serif text-base/relaxed text-pretty text-toned">
            {{ $t("subjectsTopics.lead") }}
        </p>
        <div class="mt-6 gap-x-10 sm:columns-2 lg:columns-4">
            <section
                v-for="[letter, group] in letters"
                :key="letter"
                :aria-label="$t('subjectsTopics.letter', { letter })"
                class="mb-6 break-inside-avoid last:mb-0"
            >
                <p
                    class="border-b border-default pb-1 font-serif text-2xl text-huella-teal-600"
                    aria-hidden="true"
                >
                    {{ letter }}
                </p>
                <ul>
                    <li v-for="{ value, count } in group" :key="value.id">
                        <ULink
                            raw
                            :to="{ name: 'tag', params: { slug: value.slug } }"
                            class="group flex min-h-11 items-center justify-between gap-3 font-serif text-base text-highlighted focus-visible:rounded-xs"
                        >
                            <span
                                class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline"
                                >{{ value.name }}</span
                            >
                            <span
                                class="font-sans text-meta text-muted tabular-nums"
                                aria-hidden="true"
                                >{{ count }}</span
                            >
                            <span class="sr-only">{{
                                $t("subjectsTopics.count", { count }, count)
                            }}</span>
                        </ULink>
                    </li>
                </ul>
            </section>
        </div>
    </section>
</template>
