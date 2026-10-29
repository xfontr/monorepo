<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    search?: ArticleSearch;
    to: (page: number) => RouteLocationRaw;
    pending?: boolean;
}

const props = withDefaults(defineProps<Props>(), { pending: false });

const { t } = useI18n();

const headingId = useId();

const subjects = computed<LinkAction[] | undefined>(() =>
    props.search?.subjects.map(({ name, slug }) => ({
        label: name,
        to: { name: "category", params: { slug } },
    })),
);

const announcement = computed<string>(() => {
    if (props.pending || !props.search) return "";

    const { total, query } = props.search;

    return total
        ? t("searchResults.count", { total: t("searchResults.total", total), query })
        : t("noResults.title", { query });
});
</script>

<template>
    <section :aria-busy="pending" :aria-labelledby="search?.total ? headingId : undefined">
        <!-- Always rendered: a status region is only announced when its text changes later -->
        <p role="status" class="sr-only">{{ announcement }}</p>
        <ListingSkeletonList v-if="pending || !search" />
        <template v-else-if="search.total">
            <h2
                :id="headingId"
                class="border-b-2 border-huella-slate-900 pb-3 font-sans text-sm text-muted"
            >
                <I18nT keypath="searchResults.count" tag="span" scope="global">
                    <template #total>
                        <strong class="font-semibold text-highlighted tabular-nums">{{
                            $t("searchResults.total", search.total)
                        }}</strong>
                    </template>
                    <template #query>{{ search.query }}</template>
                </I18nT>
            </h2>
            <SummaryList :articles="search.items" variant="standard" />
            <ListingPagination
                :page="search.page"
                :total="search.total"
                :per-page="search.perPage"
                :to
                class="mt-7"
            />
        </template>
        <ListingNoResults v-else :query="search.query" :subjects />
    </section>
</template>
