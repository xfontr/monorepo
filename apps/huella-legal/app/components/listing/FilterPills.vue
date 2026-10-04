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
        class="-mx-4 basis-[calc(100%+2rem)] overflow-x-auto border-b border-default px-4 [scrollbar-width:none] sm:mx-0 sm:basis-full sm:px-0"
    >
        <ul class="-ml-3 flex">
            <li
                v-for="{ label: name, to, active, count } in items"
                :key="name"
            >
                <ULink
                    raw
                    :to
                    :aria-current="active ? 'true' : undefined"
                    class="relative inline-flex min-h-12 items-center gap-1.5 px-3 font-sans text-sm font-semibold whitespace-nowrap text-muted transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 hover:text-highlighted hover:after:bg-ivory-400 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=true]:text-highlighted aria-[current=true]:after:bg-huella-slate-900"
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
