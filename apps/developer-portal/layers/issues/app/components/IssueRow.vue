<template>
    <div class="px-4 py-3 transition-colors hover:bg-elevated/50">
        <div class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0 font-mono text-xs text-dimmed tabular-nums"
                >#{{ issue.number }}</span
            >

            <div class="min-w-0 flex-1">
                <button
                    type="button"
                    class="w-full text-left text-sm"
                    @click="expanded = !expanded"
                >
                    {{ issue.title }}
                </button>

                <p v-if="summary && !expanded" class="mt-0.5 truncate text-xs text-muted">
                    {{ summary }}
                </p>

                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <UBadge
                        v-for="label in issue.labels"
                        :key="label"
                        color="neutral"
                        variant="subtle"
                        size="sm"
                        :label
                    />

                    <span v-if="!compact" class="text-2xs text-dimmed">updated {{ updated }}</span>
                </div>

                <div v-if="expanded" class="mt-3 flex flex-col gap-3">
                    <p v-if="issue.body" class="text-sm whitespace-pre-line text-muted">
                        {{ issue.body }}
                    </p>

                    <p v-else class="text-sm text-dimmed italic">No description.</p>

                    <div class="flex items-center gap-3">
                        <UButton
                            :to="issue.url"
                            target="_blank"
                            external
                            :label="`Open #${issue.number} on GitHub`"
                            icon="i-lucide-external-link"
                            color="neutral"
                            variant="subtle"
                            size="xs"
                        />

                        <span v-if="issue.assignees.length > 0" class="text-xs text-dimmed">{{
                            assignees
                        }}</span>
                    </div>
                </div>
            </div>

            <UButton
                :to="issue.url"
                target="_blank"
                external
                icon="i-lucide-external-link"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="`Open issue ${issue.number} on GitHub`"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { summarize } from "#layers/github/shared/issues.ts";
import type { Issue } from "#layers/github/shared/issues.ts";

interface Props {
    issue: Issue;
    compact?: boolean;
}

const { issue, compact = false } = defineProps<Props>();

const expanded = ref(false);

/**
 * The row shows a clamped line; opening it shows the whole body as plain text. Rendering the
 * markdown here would mean a second renderer to keep in step with the docs one, for a body that is
 * one click from the place it was written for.
 */
const summary = computed(() => summarize(issue.body, compact ? 100 : 160));
const updated = computed(() => relativeTime(issue.updatedAt));
const assignees = computed(() => issue.assignees.join(", "));
</script>
