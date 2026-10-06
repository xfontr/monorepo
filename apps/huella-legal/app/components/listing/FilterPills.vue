<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

export interface FilterPill {
    label: string
    to: RouteLocationRaw
    count: number
    active?: boolean
}

interface Props {
    label: string
    items: FilterPill[]
}

defineProps<Props>();
</script>

<template>
    <nav
        :aria-label="label"
        class="overflow-x-auto border-b border-default [scrollbar-width:none]"
    >
        <ul class="-ml-3 flex">
            <li
                v-for="{ label: name, to, active, count } in items"
                :key="name"
            >
                <ULink
                    raw
                    :to
                    :aria-current="active ? 'page' : undefined"
                    class="relative inline-flex min-h-12 items-center gap-1.5 px-3 font-sans text-sm font-semibold whitespace-nowrap text-muted transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 hover:text-highlighted hover:after:bg-ivory-400 focus-visible:rounded-xs focus-visible:-outline-offset-2 aria-[current=page]:text-highlighted aria-[current=page]:after:bg-huella-slate-900"
                >
                    {{ name }}
                    <span
                        class="font-medium tabular-nums text-muted"
                        aria-hidden="true"
                    >{{ count }}</span>
                    <span class="sr-only">{{ $t("filterPills.count", { count }, count) }}</span>
                </ULink>
            </li>
        </ul>
    </nav>
</template>
