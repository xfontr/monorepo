<script setup lang="ts">
interface Props {
    author: Author;
    total: number;
    since?: string;
}

const props = defineProps<Props>();

const { t, d } = useI18n();

const authorInitials = computed<string>(() => initials(props.author.name));

const stats = computed(() => [
    { label: t("archiveAuthor.stats.publications", props.total), value: props.total },
    ...(props.since
        ? [{ label: t("archiveAuthor.stats.since"), value: d(props.since, "year") }]
        : []),
]);
</script>

<template>
    <div class="grid gap-6 md:grid-cols-[6rem_1fr] md:gap-8 lg:grid-cols-[7rem_1fr_16rem]">
        <UAvatar
            :src="author.avatar?.url"
            :text="authorInitials"
            size="3xl"
            aria-hidden="true"
            class="size-20 text-lg md:size-24 lg:size-28"
        />
        <BasePageHeading
            :kicker="$t('archiveAuthor.kicker')"
            :title="author.name"
            :lead="author.bio"
        />
        <dl
            class="grid grid-cols-2 self-end border-t border-default md:col-span-2 lg:col-span-1 lg:grid-cols-1"
        >
            <div
                v-for="{ label, value } in stats"
                :key="label"
                class="flex flex-col-reverse gap-1 border-b border-default py-4 even:pl-5 lg:even:pl-0"
            >
                <dt class="font-sans text-meta text-muted">
                    {{ label }}
                </dt>
                <dd class="font-serif text-[2rem] leading-none text-highlighted tabular-nums">
                    {{ value }}
                </dd>
            </div>
        </dl>
    </div>
</template>
