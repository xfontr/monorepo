<script setup lang="ts">
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    query: string
    subjects: LinkAction[]
    suggestion?: LinkAction
}

withDefaults(defineProps<Props>(), {
    suggestion: undefined,
});

const titleId = useId();
</script>

<template>
    <UEmpty
        as="section"
        :aria-labelledby="titleId"
        :ui="{ description: 'max-w-none' }"
    >
        <template #leading>
            <UIcon
                name="i-lucide-search-x"
                class="size-7 text-dimmed"
            />
        </template>
        <template #title>
            <span :id="titleId">{{ $t("noResults.title", { query }) }}</span>
        </template>
        <template #description>
            <ul class="list-disc pl-5 marker:text-huella-teal-500">
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
        </template>
        <template
            v-if="subjects.length"
            #body
        >
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
    </UEmpty>
</template>
