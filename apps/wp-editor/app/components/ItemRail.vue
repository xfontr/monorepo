<script setup lang="ts">
import type { Item, ItemKey } from "#shared/types.ts";

interface Props {
    items: Item[];
    selected: ItemKey | undefined;
}

const props = defineProps<Props>();
const emit = defineEmits<{ select: [key: ItemKey] }>();
const filter = defineModel<ItemFilter>("filter", { required: true });
const filterItems = computed(() =>
    ITEM_FILTERS.map((value) => ({
        label: `${value} (${props.items.filter((item) => matchesFilter(item, value)).length})`,
        value,
    })),
);

const visible = computed(() => props.items.filter((item) => matchesFilter(item, filter.value)));

const list = useTemplateRef<HTMLElement>("list");

watch(
    () => props.selected,
    async (key) => {
        await nextTick();
        list.value?.querySelector(`[data-key="${key}"]`)?.scrollIntoView({ block: "nearest" });
    },
);
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="border-b border-default p-3">
            <USelect v-model="filter" :items="filterItems" class="w-full" size="sm" />
        </div>

        <ul ref="list" class="min-h-0 flex-1 overflow-y-auto">
            <li v-for="item in visible" :key="item.key" :data-key="item.key">
                <button
                    type="button"
                    class="flex w-full gap-3 border-b border-default px-3 py-2.5 text-left transition-colors hover:bg-elevated/60"
                    :class="item.key === selected ? 'bg-elevated' : ''"
                    @click="emit('select', item.key)"
                >
                    <img
                        v-if="item.base.image"
                        :src="item.base.image"
                        alt=""
                        class="size-12 shrink-0 rounded-md object-cover"
                    />
                    <div
                        v-else
                        class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted"
                    >
                        <UIcon name="i-lucide-file-text" class="size-5 text-dimmed" />
                    </div>

                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                        <p class="line-clamp-2 text-sm font-medium">
                            {{ item.base.title || item.key }}
                        </p>
                        <p class="truncate text-xs text-muted">
                            {{ item.base.author }} · {{ formatDate(item.base.date) }}
                        </p>
                        <div class="flex items-center gap-1.5">
                            <UBadge v-bind="itemBadge(item)" variant="subtle" size="sm" />
                            <UTooltip
                                v-if="item.proposal?.reviewRequested"
                                :text="item.proposal.reviewRequested"
                            >
                                <UIcon
                                    name="i-lucide-flag"
                                    class="size-3.5 text-warning"
                                    aria-label="Review requested"
                                />
                            </UTooltip>
                            <span class="text-xs text-dimmed">{{ item.key }}</span>
                        </div>
                    </div>
                </button>
            </li>
        </ul>

        <UEmpty
            v-if="visible.length === 0"
            icon="i-lucide-filter-x"
            title="Nothing in this filter"
            class="flex-1"
        />
    </div>
</template>
