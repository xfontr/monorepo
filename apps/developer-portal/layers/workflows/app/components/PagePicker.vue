<template>
    <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2">
            <UButton
                v-for="type in types"
                :key="type.id"
                :label="`${type.title} · ${type.cost} SP`"
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                @click="add(type.id)"
            />
        </div>

        <ul v-if="cards.length > 0" class="grid gap-3 sm:grid-cols-2">
            <li
                v-for="card in cards"
                :key="card.key"
                class="flex flex-col gap-3 rounded-xl border p-4"
                :class="card.editing ? 'border-primary bg-primary/5' : 'border-default'"
            >
                <div class="flex items-start gap-3">
                    <span
                        class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted"
                    >
                        <UIcon name="i-lucide-file-text" class="size-5" />
                    </span>
                    <div class="min-w-0 flex-1">
                        <UInput
                            v-if="card.editing"
                            :model-value="card.title"
                            :placeholder="`${card.typeTitle} name`"
                            :aria-label="`${card.typeTitle} name`"
                            autofocus
                            class="w-full"
                            @update:model-value="rename(card.key, String($event))"
                            @keydown.enter.prevent="commit(card.key)"
                            @blur="commit(card.key)"
                        />
                        <button
                            v-else
                            type="button"
                            class="block w-full cursor-text truncate py-1 text-left font-semibold"
                            :aria-label="`Rename ${card.title}`"
                            @click="editing = card.key"
                        >
                            {{ card.title }}
                        </button>
                        <p v-if="card.error" class="mt-1 text-xs text-error">{{ card.error }}</p>
                    </div>
                    <UButton
                        icon="i-lucide-x"
                        :aria-label="`Remove ${card.title || card.typeTitle.toLowerCase()}`"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        @mousedown.prevent
                        @click="remove(card.key)"
                    />
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                    <UBadge :label="card.typeTitle" color="neutral" variant="subtle" size="sm" />
                    <UBadge
                        :label="`${card.points} SP`"
                        color="neutral"
                        variant="subtle"
                        size="sm"
                        class="tabular-nums"
                    />
                    <span v-if="card.note" class="text-xs text-muted">{{ card.note }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { pageCosts, type Template } from "#layers/workflows/shared/workflows.ts";

interface Props {
    template: Template;
    /** One per page, in the model's order. */
    errors: (string | null)[];
}

const { template, errors } = defineProps<Props>();
const pages = defineModel<{ key: number; type: string; title: string }[]>({ required: true });

const editing = ref<number | null>(null);

/** The setups a type waits on that come in with a page, such as the comments setup. */
const setupsOf = (type: string) =>
    template.capabilities.filter(
        ({ id, onDemand }) =>
            onDemand &&
            template.types.find((candidate) => candidate.id === type)?.dependsOn.includes(id),
    );

const types = computed(() =>
    template.types.map((type) => ({
        ...type,
        cost: pageCosts(template, [...pages.value, { type: type.id }]).at(-1)?.points ?? 0,
    })),
);

const cards = computed(() => {
    const costs = pageCosts(template, pages.value);

    return pages.value.map((page, index) => {
        const type = template.types.find(({ id }) => id === page.type);
        const { points, setup } = costs[index] ?? { points: 0, setup: [] };
        const shared = setupsOf(page.type).filter((block) => !setup.includes(block));

        return {
            ...page,
            typeTitle: type?.title ?? page.type,
            points,
            note: [
                ...setup.map((block) => `Includes ${block.title}, ${block.complexity ?? 0} SP`),
                ...shared.map((block) => `${block.title} already counted`),
            ].join(" · "),
            editing: editing.value === page.key,
            // An empty title is the state a new block starts in, not a mistake yet.
            error: page.title.trim() ? (errors[index] ?? null) : null,
        };
    });
});

const add = (type: string) => {
    const key = Math.max(0, ...pages.value.map((page) => page.key)) + 1;
    pages.value = [...pages.value, { key, type, title: "" }];
    editing.value = key;
};

const rename = (key: number, title: string) => {
    pages.value = pages.value.map((page) => (page.key === key ? { ...page, title } : page));
};

const remove = (key: number) => {
    pages.value = pages.value.filter((page) => page.key !== key);
    if (editing.value === key) editing.value = null;
};

/** Saves the block being named; one left empty is dropped, one with a problem stays open. */
const commit = (key: number) => {
    const index = pages.value.findIndex((page) => page.key === key);
    const page = pages.value[index];

    if (!page) return;
    if (!page.title.trim()) remove(key);
    else if (!errors[index]) editing.value = null;
};
</script>
