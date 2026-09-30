<script setup lang="ts">
interface Props {
    title: string
    kicker?: string
    link?: string
    to?: string
    id?: string
}

withDefaults(defineProps<Props>(), {
    kicker: undefined,
    link: undefined,
    to: undefined,
    id: undefined,
});
</script>

<template>
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t-2 border-huella-slate-900 pt-4">
        <div>
            <p
                v-if="kicker"
                class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary"
            >
                {{ kicker }}
            </p>
            <h2
                :id="id"
                class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                :class="kicker && 'mt-1'"
            >
                {{ title }}
            </h2>
        </div>
        <UButton
            v-if="link && to"
            variant="link"
            :label="link"
            :to="to"
            trailing-icon="i-lucide-arrow-right"
            class="-mr-3"
        />
    </div>
</template>
