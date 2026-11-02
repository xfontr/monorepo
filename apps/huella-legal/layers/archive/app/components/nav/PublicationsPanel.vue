<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { LinkAction } from "~/types/LinkAction";

const FEATURED = 3;

const { t } = useI18n();
const browseId = useId();
const latestId = useId();

const { data: home, status } = useCachedFetch<Home>("/api/home");

const browse = computed<LinkAction[]>(() => [
    { label: t("navPublicationsPanel.all"), to: { name: "publications" } },
    ...(Object.keys(FORMAT_KEYS) as ArticleSummary["format"][]).map((format) => ({
        label: t(`navPublicationsPanel.formats.${FORMAT_KEYS[format]}`),
        to: { name: "publications", query: { format } } satisfies RouteLocationRaw,
    })),
    { label: t("navPublicationsPanel.search"), to: { name: "search" } },
]);

const featured = computed<ArticleSummary[]>(() =>
    [home.value?.lead, ...(home.value?.latest ?? [])]
        .filter((article) => article !== undefined)
        .slice(0, FEATURED),
);

const hasFeatured = computed<boolean>(
    () => status.value === "pending" || featured.value.length > 0,
);
</script>

<template>
    <div
        class="grid gap-6 p-5"
        :class="hasFeatured ? 'w-152 grid-cols-[11rem_1fr]' : 'w-56 grid-cols-1'"
    >
        <div>
            <p :id="browseId" class="text-kicker text-muted">
                {{ $t("navPublicationsPanel.browse") }}
            </p>
            <ul :aria-labelledby="browseId" class="mt-2 flex flex-col">
                <li v-for="{ label, to } in browse" :key="label">
                    <ULink
                        raw
                        :to
                        class="flex min-h-10 items-center font-sans text-sm font-semibold text-toned underline-offset-4 hover:text-highlighted hover:underline focus-visible:rounded-xs"
                        >{{ label }}</ULink
                    >
                </li>
            </ul>
        </div>

        <div v-if="hasFeatured" class="border-l border-default pl-6">
            <p :id="latestId" class="text-kicker text-muted">
                {{ $t("navPublicationsPanel.latest") }}
            </p>
            <template v-if="status === 'pending'">
                <p class="sr-only">{{ $t("common.loading") }}</p>
                <ul
                    aria-hidden="true"
                    class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)"
                >
                    <li v-for="row in FEATURED" :key="row" class="flex flex-col gap-2 py-3">
                        <USkeleton class="h-3 w-24" />
                        <USkeleton class="h-5 w-11/12" />
                        <USkeleton class="h-3 w-32" />
                    </li>
                </ul>
            </template>
            <ul
                v-else
                :aria-labelledby="latestId"
                class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)"
            >
                <li
                    v-for="article in featured"
                    :key="article.id"
                    class="relative flex flex-col gap-1 py-3"
                >
                    <BaseKicker v-if="article.category">{{ article.category.name }}</BaseKicker>
                    <ULink
                        raw
                        :to="{ name: 'article', params: { slug: article.slug } }"
                        class="line-clamp-2 font-serif text-base/snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] after:absolute after:inset-0 hover:underline focus-visible:rounded-xs"
                        >{{ article.title }}</ULink
                    >
                    <span class="font-sans text-meta text-muted">{{
                        article.authors.map(({ name }) => name).join(", ")
                    }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>
