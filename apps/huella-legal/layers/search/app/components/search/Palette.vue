<script setup lang="ts">
import { MAX_SEARCH_LENGTH } from "@monorepo/content";
import type { CommandPaletteGroup, CommandPaletteItem } from "@nuxt/ui";

const emit = defineEmits<{ close: [] }>();
const SUBJECTS = 6;
const LATEST = 4;
const MATCHES = 5;

const { t, d, locale } = useI18n();

const term = ref<string>("");
const { home, search, pending } = useSearchPreview(term);

const typed = computed<string>(() => term.value.trim());

const toSubject = ({ value, count }: Facet<Category>): CommandPaletteItem => ({
    label: value.name,
    suffix: String(count),
    to: { name: "category", params: { slug: value.slug } },
});

const toArticle = (article: ArticleSummary): CommandPaletteItem => ({
    label: article.title,
    article,
    to: { name: "article", params: { slug: article.slug } },
});

const byline = (article: ArticleSummary): string =>
    [
        new Intl.ListFormat(locale.value, { type: "conjunction" }).format(
            article.authors.map(({ name }) => name),
        ),
        article.publishedAt && d(article.publishedAt, "long"),
    ]
        .filter(Boolean)
        .join(" · ");

const browseGroups = computed<CommandPaletteGroup[]>(() => [
    {
        id: "subjects",
        label: t("searchPalette.subjects"),
        items:
            home.value?.subjects
                .toSorted((a, b) => b.count - a.count)
                .slice(0, SUBJECTS)
                .map(toSubject) ?? [],
    },
    {
        id: "latest",
        label: t("searchPalette.latest"),
        slot: "article",
        items: home.value?.latest.slice(0, LATEST).map(toArticle) ?? [],
    },
]);

const searchGroups = computed<CommandPaletteGroup[]>(() => [
    {
        id: "all",
        items: [
            {
                slot: "all",
                label: t("searchPalette.all", { query: typed.value }),
                suffix:
                    search.value?.query === typed.value
                        ? t("searchPalette.total", search.value.total)
                        : undefined,
                to: { name: "search", query: { query: typed.value } },
            },
        ],
    },
    {
        id: "subjects",
        label: t("searchPalette.subjects"),
        items:
            home.value?.subjects
                .filter(({ value }) =>
                    normalizeText(value.name).includes(normalizeText(typed.value)),
                )
                .map(toSubject) ?? [],
    },
    {
        id: "articles",
        label: t("searchPalette.articles"),
        slot: "article",
        items: search.value?.items.slice(0, MATCHES).map(toArticle) ?? [],
    },
]);

const input = computed(() => ({
    maxlength: MAX_SEARCH_LENGTH,
    "aria-label": t("searchPalette.label"),
}));

const groups = computed<CommandPaletteGroup[]>(() =>
    (typed.value ? searchGroups.value : browseGroups.value).map((group) => ({
        ...group,
        ignoreFilter: true,
    })),
);
</script>

<template>
    <UCommandPalette
        v-model:search-term="term"
        :groups
        :loading="pending"
        :placeholder="$t('searchPalette.placeholder')"
        :input
        :ui="{ root: 'h-full sm:h-auto' }"
        @update:model-value="emit('close')"
    >
        <template #close>
            <UButton
                variant="link"
                color="neutral"
                :label="$t('searchPalette.close')"
                class="sm:hidden"
                @click="emit('close')"
            />
            <UKbd value="escape" class="max-sm:hidden" />
        </template>

        <template #all="{ item }">
            <UIcon name="i-lucide-search" class="size-5 shrink-0 text-primary" />
            <span class="font-semibold text-primary">{{ item.label }}</span>
            <span v-if="item.suffix" class="text-muted"
                ><span class="sr-only">, </span>{{ item.suffix }}</span
            >
        </template>

        <template #article="{ item }">
            <span class="flex min-w-0 flex-col gap-1 text-start">
                <BaseKicker v-if="item.article.category">{{
                    item.article.category.name
                }}</BaseKicker>
                <span class="font-serif text-base/snug text-highlighted">{{ item.label }}</span>
                <span class="font-sans text-meta text-muted">{{ byline(item.article) }}</span>
            </span>
        </template>

        <template #empty>
            <span class="sr-only">{{ $t("common.loading") }}</span>
        </template>

        <template #footer>
            <div class="hidden items-center gap-4 px-2 py-1.5 font-sans text-xs text-muted sm:flex">
                <span class="flex items-center gap-1">
                    <UKbd value="arrowup" /><UKbd value="arrowdown" />
                    {{ $t("searchPalette.hints.move") }}
                </span>
                <span class="flex items-center gap-1">
                    <UKbd value="enter" /> {{ $t("searchPalette.hints.open") }}
                </span>
                <span class="ml-auto flex items-center gap-1">
                    <UKbd value="/" /> {{ $t("searchPalette.hints.shortcut") }}
                </span>
            </div>
        </template>
    </UCommandPalette>
</template>
