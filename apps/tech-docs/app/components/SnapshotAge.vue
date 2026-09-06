<script setup lang="ts">
import type { Manifest } from "../../shared/types.ts";

const { manifest, artifact = undefined } = defineProps<{ manifest: Manifest | null, artifact?: string }>();

const status = computed(() => (artifact ? manifest?.artifacts[artifact] : undefined));

/**
 * Every page that reads the snapshot shows this. A report whose age is not on the page is a report
 * that quietly starts lying — and `.report/` is gitignored, so on a fresh clone the honest answer
 * is "never collected".
 */
const failed = computed(() => status.value?.ok === false);
</script>

<template>
    <div class="flex items-center gap-2 text-xs text-muted">
        <UIcon
            :name="manifest ? failed ? 'i-lucide-triangle-alert' : 'i-lucide-clock' : 'i-lucide-circle-slash'"
            class="size-3.5"
            :class="failed ? 'tone-bad' : ''"
        />

        <template v-if="!manifest">
            Never collected — run <code class="font-mono text-default">pnpm tech-docs:collect</code>
        </template>

        <template v-else-if="failed">
            {{ artifact }} failed to collect: {{ status?.error }}
        </template>

        <template v-else>
            Collected {{ relativeTime(status?.generatedAt ?? manifest.generatedAt) }}
            at <code class="font-mono text-default">{{ manifest.commit }}</code>
            on {{ manifest.branch }}
        </template>
    </div>
</template>
