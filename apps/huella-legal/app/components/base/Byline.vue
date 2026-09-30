<script setup lang="ts">
type BylineAuthor = Pick<Author, "id" | "name" | "avatar"> & { to?: string };

interface Props {
    authors: BylineAuthor[]
    publishedAt?: string
    readingMinutes?: number
    avatars?: boolean
}

const props = withDefaults(defineProps<Props>(), { publishedAt: undefined, readingMinutes: undefined, avatars: false });

// Intl places the commas and "y", so each name stays its own link in any locale
const names = (locale: string) => {
    let index = 0;

    return new Intl.ListFormat(locale, { type: "conjunction" })
        .formatToParts(props.authors.map((author) => author.name))
        .map((part) => (part.type === "element" ? { author: props.authors[index++] } : { literal: part.value }));
};

// Pinned to the journal's zone so the server and the browser print the same day
const date = (locale: string) => props.publishedAt && new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
}).format(new Date(props.publishedAt));
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
            <!-- Separators hang in a clipped negative margin, so a wrapped line never starts with "·" -->
            <ul class="-ml-5 flex flex-wrap gap-y-1 [&>li]:flex [&>li]:before:shrink-0 [&>li]:before:w-5 [&>li]:before:text-center [&>li]:before:text-dimmed [&>li]:before:content-['·']">
                <li class="text-toned">
                    <span>
                        <template
                            v-for="(part, index) in names($i18n.locale)"
                            :key="index"
                        >
                            <template v-if="part.literal">{{ part.literal }}</template>
                            <ULink
                                v-else-if="part.author?.to"
                                :to="part.author.to"
                                raw
                                class="font-semibold text-highlighted underline-offset-3 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >{{ part.author.name }}</ULink>
                            <span
                                v-else
                                class="font-semibold text-highlighted"
                            >{{ part.author?.name }}</span>
                        </template>
                    </span>
                </li>
                <li v-if="publishedAt">
                    <time :datetime="publishedAt">{{ date($i18n.locale) }}</time>
                </li>
                <li v-if="readingMinutes">
                    {{ $t("byline.readingTime", { minutes: readingMinutes }, readingMinutes) }}
                </li>
            </ul>
        </div>
    </div>
</template>
