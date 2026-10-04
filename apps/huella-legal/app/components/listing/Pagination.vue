<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import { PAGE_PARAM } from "../../config/listing";

interface Props {
    page: number
    total: number
    perPage: number
}

const props = defineProps<Props>();

const route = useRoute();

const pageCount = computed<number>(() => Math.max(1, Math.ceil(props.total / props.perPage)));
const previousLink = computed(() => (props.page > 1 ? pageLink(props.page - 1) : undefined));
const nextLink = computed(() => (props.page < pageCount.value ? pageLink(props.page + 1) : undefined));

function pageLink(target: number): RouteLocationRaw {
    return { query: { ...route.query, [PAGE_PARAM]: target > 1 ? String(target) : undefined } };
}
</script>

<template>
    <div
        v-if="pageCount > 1"
        class="relative border-t border-default"
    >
        <p class="pointer-events-none absolute inset-x-0 top-0 flex h-12 items-center justify-center font-sans text-meta text-muted tabular-nums sm:hidden">
            {{ $t("pagination.position", { page, total: pageCount }) }}
        </p>
        <UPagination
            :page
            :total
            :items-per-page="perPage"
            :sibling-count="1"
            :show-controls="false"
            :aria-label="$t('pagination.label')"
            show-edges
        >
            <template #prev>
                <UButton
                    variant="link"
                    icon="i-lucide-arrow-left"
                    :label="$t('pagination.previous.text')"
                    :aria-label="$t('pagination.previous.label')"
                    :to="previousLink"
                    :disabled="!previousLink"
                    class="-ml-3 min-h-12"
                />
            </template>
            <template #item="{ item }">
                <ULink
                    v-if="item.type === 'page'"
                    raw
                    :to="pageLink(item.value)"
                    :aria-label="$t('pagination.page', { page: item.value })"
                    :aria-current="item.value === page ? 'page' : undefined"
                    class="relative inline-flex min-h-12 min-w-11 items-center justify-center font-sans text-sm font-semibold text-muted tabular-nums transition-colors before:absolute before:inset-x-1.5 before:-top-px before:h-0.5 before:transition-colors hover:text-highlighted hover:before:bg-ivory-400 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[current=page]:text-highlighted aria-[current=page]:before:bg-huella-slate-900 max-sm:hidden"
                >
                    {{ item.value }}
                </ULink>
            </template>
            <template #ellipsis>
                <span class="inline-flex min-h-12 min-w-8 items-center justify-center font-sans text-sm text-dimmed">…</span>
            </template>
            <template #next>
                <UButton
                    variant="link"
                    trailing-icon="i-lucide-arrow-right"
                    :label="$t('pagination.next.text')"
                    :aria-label="$t('pagination.next.label')"
                    :to="nextLink"
                    :disabled="!nextLink"
                    class="-mr-3 min-h-12"
                />
            </template>
        </UPagination>
    </div>
</template>
