<script setup lang="ts">
import { useElementVisibility } from "@vueuse/core";

interface Props {
    drawOnView?: boolean;
}

const props = withDefaults(defineProps<Props>(), { drawOnView: false });

const RIDGES = [
    "M2 12a10 10 0 0 1 18-6",
    "M9 6.8a6 6 0 0 1 9 5.2v2",
    "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
    "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
    "M14 13.12c0 2.38 0 6.38-1 8.88",
    "M21.8 16c.2-2 .131-5.354 0-6",
    "M17.29 21.02c.12-.6.43-2.3.5-3.02",
    "M8.65 22c.21-.66.45-1.32.57-2",
    "M2 16h.01",
] as const;

const root = useTemplateRef("root");
const visible = useElementVisibility(root, { once: true, threshold: 0.25 });

const waiting = computed<boolean>(() => props.drawOnView && !visible.value);
</script>

<template>
    <svg
        ref="root"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="hl-about-fingerprint"
        :data-waiting="waiting || undefined"
    >
        <path
            v-for="(ridge, index) in RIDGES"
            :key="ridge"
            :d="ridge"
            pathLength="1"
            :style="{ '--ridge': index }"
        />
    </svg>
</template>

<style>
.hl-about-fingerprint path {
    stroke-dasharray: 1;
}

@media (prefers-reduced-motion: no-preference) {
    .hl-about-fingerprint path {
        animation: hl-about-draw 1.6s cubic-bezier(0.65, 0, 0.35, 1) both;
        animation-delay: calc(var(--ridge) * 110ms + 150ms);
    }

    .hl-about-fingerprint[data-waiting] path {
        animation-play-state: paused;
    }
}

@keyframes hl-about-draw {
    from {
        stroke-dashoffset: 1;
    }
}
</style>
