<script setup lang="ts">
interface Props {
    title: string;
    subjects: Facet<Category>[];
    currentSubject?: string;
    archiveLink?: boolean;
}

const props = withDefaults(defineProps<Props>(), { archiveLink: false });

const shown = computed(() =>
    props.subjects.filter(({ value }) => value.id !== props.currentSubject),
);
</script>

<template>
    <aside :aria-label="$t('archiveSubjects.label')">
        <h2 class="flex min-h-12 items-center text-kicker text-muted">
            {{ title }}
        </h2>
        <ul class="flex flex-col border-t border-(--ui-border-muted)">
            <li
                v-for="{ value, count } in shown"
                :key="value.id"
                class="border-b border-(--ui-border-muted)"
            >
                <ULink
                    raw
                    :to="{ name: 'category', params: { slug: value.slug } }"
                    class="group flex min-h-11 items-center justify-between gap-3 py-1 font-serif text-base text-highlighted focus-visible:rounded-xs"
                >
                    <span
                        class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline"
                        >{{ value.name }}</span
                    >
                    <span class="font-sans text-meta tabular-nums text-muted" aria-hidden="true">{{
                        count
                    }}</span>
                    <span class="sr-only">{{ $t("archiveSubjects.count", { count }, count) }}</span>
                </ULink>
            </li>
        </ul>
        <UButton
            v-if="archiveLink"
            variant="link"
            :label="$t('archiveSubjects.all')"
            trailing-icon="i-lucide-arrow-right"
            :to="{ name: 'publications' }"
            class="mt-2 -ml-3"
        />
    </aside>
</template>
