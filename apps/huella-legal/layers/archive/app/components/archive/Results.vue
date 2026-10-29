<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { FilterPill } from "~/components/listing/FilterPills.vue";

interface Props {
    listing: ArticleListing;
    to: (page: number) => RouteLocationRaw;
    formatPills?: FilterPill[];
    heading?: string;
    pending?: boolean;
    emptySubject?: string;
}

withDefaults(defineProps<Props>(), {
    formatPills: () => [],
    pending: false,
});

const sort = defineModel<"newest" | "oldest">("sort", { required: true });

const headingId = useId();
</script>

<template>
    <section :aria-labelledby="headingId" :aria-busy="pending" class="min-w-0">
        <ListingFilterPills
            v-if="formatPills.length"
            :label="$t('archiveResults.formats')"
            :items="formatPills"
            class="-mx-4 px-4 sm:mx-0 sm:px-0"
        />
        <div
            class="flex flex-wrap items-center justify-between gap-x-6"
            :class="!formatPills.length && 'border-b border-default'"
        >
            <h2
                :id="headingId"
                class="flex min-h-12 items-center font-sans text-meta text-muted"
                aria-live="polite"
            >
                <template v-if="heading">
                    {{ heading }}
                </template>
                <I18nT
                    v-else
                    keypath="archiveResults.count"
                    :plural="listing.total"
                    tag="span"
                    scope="global"
                >
                    <template #count>
                        <strong class="font-semibold text-highlighted tabular-nums">{{
                            listing.total
                        }}</strong>
                    </template>
                </I18nT>
            </h2>
            <ListingSortSelect v-if="listing.total > 1" v-model="sort" />
        </div>

        <SummaryList
            v-if="listing.items.length"
            :articles="listing.items"
            class="transition-opacity"
            :class="pending && 'opacity-55'"
        />
        <ListingEmptyState
            v-else-if="emptySubject"
            :subject="emptySubject"
            :publish-to="{ name: 'publish' }"
            :browse-to="{ name: 'categories' }"
            class="mt-6"
        />

        <ListingPagination
            :page="listing.page"
            :total="listing.total"
            :per-page="listing.perPage"
            :to
        />
    </section>
</template>
