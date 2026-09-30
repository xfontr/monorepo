<script setup lang="ts">
import type { LabAuthor } from "./fixtures";

interface Props {
    authors: LabAuthor[]
    date?: string
    readingMinutes?: number
    avatars?: boolean
}

// Separators hang in a clipped negative margin, so a wrapped line never starts with "·"
withDefaults(defineProps<Props>(), { avatars: false });
</script>

<template>
    <div class="flex items-center gap-3 font-sans text-meta text-muted">
        <span
            v-if="avatars"
            class="flex shrink-0 -space-x-2"
        >
            <span
                v-for="person in authors"
                :key="person.name"
                class="flex size-9 items-center justify-center rounded-full bg-huella-slate-100 text-[0.6875rem] font-semibold text-primary ring-2 ring-(--ui-bg)"
                aria-hidden="true"
            >{{ person.initials }}</span>
        </span>
        <div class="overflow-hidden">
            <ul class="-ml-5 flex flex-wrap gap-y-1 [&>li]:flex [&>li]:before:shrink-0 [&>li]:before:w-5 [&>li]:before:text-center [&>li]:before:text-dimmed [&>li]:before:content-['·']">
                <li class="text-toned">
                    <span>
                        <template
                        v-for="(person, index) in authors"
                        :key="person.name"
                    >
                        <a
                            href="#"
                            data-inline
                            class="font-semibold text-highlighted underline-offset-3 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >{{ person.name }}</a><span v-if="index < authors.length - 2">, </span><span v-else-if="index === authors.length - 2"> y </span>
                        </template>
                    </span>
                </li>
                <li v-if="date">
                    <time>{{ date }}</time>
                </li>
                <li v-if="readingMinutes">
                    {{ readingMinutes }} min de lectura
                </li>
            </ul>
        </div>
    </div>
</template>
