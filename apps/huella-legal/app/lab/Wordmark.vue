<script setup lang="ts">
withDefaults(defineProps<{ size?: "sm" | "md" | "lg", tone?: "ink" | "paper", tagline?: boolean }>(), {
    size: "md",
    tone: "ink",
    tagline: false,
});
</script>

<template>
    <span class="inline-flex flex-col leading-none">
        <span
            class="font-serif tracking-[-0.01em] whitespace-nowrap"
            :class="[
                { sm: 'text-xl', md: 'text-[1.625rem]', lg: 'text-5xl' }[size],
                tone === 'ink' ? 'text-highlighted' : 'text-ivory-50',
            ]"
        >Huella <em :class="tone === 'ink' ? 'text-primary' : 'text-huella-teal-300'">Legal</em></span>
        <span
            v-if="tagline"
            class="mt-1.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em]"
            :class="tone === 'ink' ? 'text-muted' : 'text-huella-slate-200'"
        >Revista jurídica</span>
    </span>
</template>
