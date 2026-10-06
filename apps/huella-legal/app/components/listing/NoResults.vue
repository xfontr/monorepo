<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface Link {
    label: string
    to: string
}

interface Props {
    query: string
    subjects: Link[]
    suggestion?: { label: string, to: RouteLocationRaw }
}

withDefaults(defineProps<Props>(), {
    suggestion: undefined,
});

const titleId = useId();
</script>

<template>
    <section
        :aria-labelledby="titleId"
        class="flex flex-col items-start gap-4 rounded-sm border border-default px-5 py-10 md:px-12"
    >
        <UIcon
            name="i-lucide-search-x"
            class="size-7 text-dimmed"
        />
        <h2
            :id="titleId"
            class="font-serif text-h3 text-highlighted text-balance"
        >
            {{ $t("noResults.title", { query }) }}
        </h2>
        <ul class="list-disc pl-5 font-serif text-base leading-relaxed text-toned marker:text-huella-teal-500">
            <li v-if="suggestion">
                <i18nT
                    keypath="noResults.spelling"
                    scope="global"
                >
                    <template #suggestion>
                        <ULink
                            raw
                            :to="suggestion.to"
                            class="text-primary underline underline-offset-2"
                        >
                            {{ suggestion.label }}
                        </ULink>
                    </template>
                </i18nT>
            </li>
            <li>{{ $t("noResults.broaden") }}</li>
        </ul>
        <template v-if="subjects.length">
            <p class="mt-2 font-sans text-meta font-semibold text-highlighted">
                {{ $t("noResults.browse") }}
            </p>
            <ul class="flex flex-wrap gap-2">
                <li
                    v-for="{ label, to } in subjects"
                    :key="label"
                >
                    <BaseTagPill
                        :label
                        :to
                    />
                </li>
            </ul>
        </template>
    </section>
</template>
