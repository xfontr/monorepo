<template>
    <div
        class="relative flex size-full items-center justify-center overflow-hidden"
        :class="ui.root"
        aria-hidden="true"
    >
        <span class="font-serif text-glyph leading-none select-none">§</span>
        <span
            v-if="label"
            class="absolute bottom-3 left-4 font-sans text-label font-semibold tracking-label uppercase"
            :class="ui.label"
            >{{ label }}</span
        >
    </div>
</template>

<script setup lang="ts">
import type { Tone } from "~/types/Tone";

interface Recipe {
    root: string;
    label: string;
}

interface Props {
    label?: string;
    tone?: Tone;
}

const props = withDefaults(defineProps<Props>(), {
    tone: "paper",
});

const TONES = {
    paper: { root: "bg-accented text-ivory-400", label: "text-ivory-700" },
    slate: { root: "bg-huella-slate-800 text-huella-slate-600", label: "text-huella-slate-300" },
} as const satisfies Record<Tone, Recipe>;

const ui = computed<Recipe>(() => TONES[props.tone]);
</script>
