<script setup lang="ts">
import type { Issue } from "../../shared/types.ts";
import { summarize } from "../../shared/issues.ts";

const { issue, compact = false } = defineProps<{ issue: Issue, compact?: boolean }>();

const expanded = ref(false);

/**
 * The row shows a clamped line; opening it shows the whole body as plain text. Rendering the
 * markdown here would mean a second renderer to keep in step with the docs one, for a body that is
 * one click from the place it was written for.
 */
const summary = computed(() => summarize(issue.body, compact ? 100 : 160));
</script>

<template>
    <div class="px-4 py-3 hover:bg-elevated/40 transition-colors">
        <div class="flex items-start gap-3">
            <span class="text-xs font-mono text-dimmed tabular-nums mt-0.5 shrink-0">#{{ issue.number }}</span>

            <div class="flex-1 min-w-0">
                <button
                    type="button"
                    class="text-left w-full text-sm"
                    @click="expanded = !expanded"
                >
                    {{ issue.title }}
                </button>

                <p
                    v-if="summary && !expanded"
                    class="text-xs text-muted truncate mt-0.5"
                >
                    {{ summary }}
                </p>

                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <UBadge
                        v-if="issue.project"
                        icon="i-lucide-columns-3"
                        color="primary"
                        variant="subtle"
                        size="sm"
                        :label="issue.projectStatus ? `${issue.project} · ${issue.projectStatus}` : issue.project"
                    />

                    <UBadge
                        v-for="label in issue.labels"
                        :key="label"
                        color="neutral"
                        variant="subtle"
                        size="sm"
                        :label="label"
                    />

                    <span
                        v-if="!compact"
                        class="text-[11px] text-dimmed"
                    >updated {{ relativeTime(issue.updatedAt) }}</span>
                </div>

                <div
                    v-if="expanded"
                    class="mt-3 flex flex-col gap-3"
                >
                    <p
                        v-if="issue.body"
                        class="text-sm text-muted whitespace-pre-line"
                    >
                        {{ issue.body }}
                    </p>

                    <p
                        v-else
                        class="text-sm text-dimmed italic"
                    >
                        No description.
                    </p>

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

                        <span
                            v-if="issue.assignees.length > 0"
                            class="text-xs text-dimmed"
                        >{{ issue.assignees.join(", ") }}</span>
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
