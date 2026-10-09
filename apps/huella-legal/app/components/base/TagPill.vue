<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface Props {
    label: string;
    to: RouteLocationRaw;
    count?: number;
    active?: boolean;
}

withDefaults(defineProps<Props>(), {
    active: false,
});
</script>

<template>
    <!-- A forced `active` never sets `aria-current` in Nuxt UI, so it is passed by hand -->
    <!-- The state classes go in `class`, the only slot input Nuxt UI merges after the neutral outline's compound variant -->
    <UButton
        :to
        :active
        :aria-current="active ? 'page' : undefined"
        color="neutral"
        variant="outline"
        active-color="primary"
        active-variant="solid"
        class="gap-1.5 rounded-full px-4 text-sm font-medium tracking-normal"
        :class="
            active
                ? 'text-ivory-50'
                : 'bg-transparent text-toned ring-default hover:bg-ivory-50 hover:text-toned hover:ring-(--ui-border-accented) active:bg-ivory-50'
        "
    >
        {{ label }}
        <template v-if="count !== undefined">
            <span
                class="tabular-nums"
                :class="active ? 'text-huella-slate-100' : 'text-muted'"
                aria-hidden="true"
                >{{ count }}</span
            >
            <span class="sr-only">{{ $t("tagPill.count", { count }, count) }}</span>
        </template>
    </UButton>
</template>
