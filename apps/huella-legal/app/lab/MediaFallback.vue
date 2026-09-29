<script setup lang="ts">
// The treatment for an article without an image: a quiet paper tile, never a broken-image icon
defineProps<{ label?: string, tone?: "paper" | "slate" }>();
</script>

<template>
    <div
        class="relative flex size-full items-center justify-center overflow-hidden"
        :class="tone === 'slate' ? 'bg-huella-slate-800 text-huella-slate-600' : 'bg-ivory-200 text-ivory-400'"
        aria-hidden="true"
    >
        <span class="font-serif text-[min(9rem,40cqw)] leading-none select-none">§</span>
        <span
            v-if="label"
            class="absolute bottom-3 left-4 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em]"
            :class="tone === 'slate' ? 'text-huella-slate-300' : 'text-ivory-600'"
        >{{ label }}</span>
    </div>
</template>
