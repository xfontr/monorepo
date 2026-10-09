<script setup lang="ts">
export interface FacetGroup {
    key: string;
    label: string;
    options: { value: string; label: string; count: number; checked: boolean }[];
    // Longer lists show this many until expanded
    limit?: number;
}

interface Props {
    groups: FacetGroup[];
    idPrefix: string;
}

defineProps<Props>();
defineEmits<{ toggle: [key: string, value: string] }>();

const expanded = ref<string[]>([]);
</script>

<template>
    <div class="flex flex-col">
        <fieldset
            v-for="group in groups"
            :key="group.key"
            class="border-t border-default py-4 first:border-t-0 first:pt-0"
        >
            <legend
                class="float-left mb-1 w-full font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
                {{ group.label }}
            </legend>
            <ul class="clear-left flex flex-col">
                <li
                    v-for="option in group.limit && !expanded.includes(group.key)
                        ? group.options.slice(0, group.limit)
                        : group.options"
                    :key="option.value"
                >
                    <label
                        :for="`${idPrefix}-${group.key}-${option.value}`"
                        class="group flex min-h-11 cursor-pointer items-center gap-3 font-serif text-base text-highlighted has-disabled:cursor-default has-disabled:text-dimmed"
                    >
                        <span class="relative flex size-4.5 shrink-0">
                            <input
                                :id="`${idPrefix}-${group.key}-${option.value}`"
                                type="checkbox"
                                :checked="option.checked"
                                :disabled="!option.count && !option.checked"
                                class="peer size-full cursor-pointer appearance-none rounded-xs border border-ivory-500 bg-ivory-50 checked:border-huella-slate-900 checked:bg-huella-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-40"
                                @change="$emit('toggle', group.key, option.value)"
                            />
                            <UIcon
                                name="i-lucide-check"
                                class="pointer-events-none absolute inset-0.5 hidden size-3.5 text-ivory-50 peer-checked:block"
                            />
                        </span>
                        <span
                            class="min-w-0 flex-1 leading-snug group-hover:underline group-has-disabled:no-underline decoration-huella-slate-300 underline-offset-[0.2em]"
                            >{{ option.label }}</span
                        >
                        <span class="font-sans text-meta tabular-nums text-muted">{{
                            option.count
                        }}</span>
                    </label>
                </li>
            </ul>
            <UButton
                v-if="group.limit && group.options.length > group.limit"
                variant="link"
                :label="
                    expanded.includes(group.key)
                        ? 'Mostrar menos'
                        : `Mostrar los ${group.options.length}`
                "
                :trailing-icon="
                    expanded.includes(group.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
                "
                class="-ml-3"
                @click="
                    expanded = expanded.includes(group.key)
                        ? expanded.filter((key) => key !== group.key)
                        : [...expanded, group.key]
                "
            />
        </fieldset>
    </div>
</template>
