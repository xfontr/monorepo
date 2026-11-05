<template>
    <div class="grid h-full min-h-0 grid-cols-2 divide-x divide-default">
        <div class="flex min-h-0 flex-col">
            <p class="border-b border-default px-3 py-1.5 text-xs font-medium text-muted">
                Original
            </p>
            <iframe
                :srcdoc="beforeDoc"
                sandbox=""
                title="Original"
                class="min-h-0 w-full flex-1 bg-white"
            />
        </div>
        <div class="flex min-h-0 flex-col">
            <p class="border-b border-default px-3 py-1.5 text-xs font-medium text-muted">
                Proposed
            </p>
            <iframe
                :srcdoc="afterDoc"
                sandbox=""
                title="Proposed"
                class="min-h-0 w-full flex-1 bg-white"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { htmlDiff } from "#shared/htmlDiff.ts";

interface Props {
    before: string;
    after: string;
}

const props = defineProps<Props>();

// Default browser styles on purpose; only the highlights are styled.
const HIGHLIGHT = `<style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 46rem; margin: 1.5rem auto; padding: 0 1rem; }
    img { max-width: 100%; height: auto; }
    ins { background: #c9f2d0; text-decoration: none; }
    del { background: #ffd2d0; }
</style>`;

const page = (body: string) =>
    `<!doctype html><meta charset="utf-8">${HIGHLIGHT}<body>${body}</body>`;

const diff = computed(() => htmlDiff(props.before, props.after));
const beforeDoc = computed(() => page(diff.value.before));
const afterDoc = computed(() => page(diff.value.after));
</script>
