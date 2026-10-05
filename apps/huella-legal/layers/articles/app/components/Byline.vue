<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

type BylineAuthor = Pick<Author, "id" | "name" | "avatar"> & { to: RouteLocationRaw };

interface Props {
    authors: BylineAuthor[]
    publishedAt?: string
    readingMinutes?: number
    avatars?: boolean
}

const props = withDefaults(defineProps<Props>(), { publishedAt: undefined, readingMinutes: undefined, avatars: false });

const { locale, d } = useI18n();

const names = computed(() => new Intl.ListFormat(locale.value, { type: "conjunction" })
    .formatToParts(props.authors.map((_, index) => String(index)))
    .map(({ type, value }) => type === "element" ? { author: props.authors[+value] } : { literal: value }));

const date = computed<string | undefined>(() => props.publishedAt && d(props.publishedAt, "long"));
</script>

<template>
    <div class="flex items-center gap-3 font-sans text-meta text-muted">
        <UAvatarGroup
            v-if="avatars"
            size="lg"
            aria-hidden="true"
            :ui="{ base: '-me-2' }"
        >
            <UAvatar
                v-for="author in authors"
                :key="author.id"
                :src="author.avatar?.url"
                :text="initials(author.name)"
                alt=""
            />
        </UAvatarGroup>
        <div class="overflow-hidden">
            <ul class="-ml-5 flex flex-wrap gap-y-1 [&>li]:flex [&>li]:before:shrink-0 [&>li]:before:w-5 [&>li]:before:text-center [&>li]:before:text-dimmed [&>li]:before:content-['·'_/_'']">
                <li class="text-toned">
                    <span
                        v-for="({ literal, author }, key) in names"
                        :key
                    >
                        <template v-if="literal">{{ literal }}</template>
                        <ULink
                            v-else-if="author"
                            :to="author.to"
                            raw
                            class="font-semibold text-highlighted underline-offset-3 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >{{ author.name }}</ULink>
                    </span>
                </li>
                <li v-if="date">
                    <time :datetime="publishedAt">{{ date }}</time>
                </li>
                <li v-if="readingMinutes">
                    {{ $t("byline.readingTime", { minutes: readingMinutes }, readingMinutes) }}
                </li>
            </ul>
        </div>
    </div>
</template>
