<template>
    <div class="flex flex-col gap-4">
        <UAlert
            color="neutral"
            variant="subtle"
            icon="i-lucide-bot"
            title="Lint rules: agent edits only"
            description="These counts come from the hook that lints every file an agent edits. Your own edits are fixed by the editor on save and never counted, so a rule that only catches people reads as quiet here."
        />

        <UCard v-if="alerts.length > 0">
            <template #header>
                <h2 class="font-semibold">Rules worth a look</h2>
            </template>

            <ul class="flex flex-col gap-2 text-sm">
                <li v-for="alert in alerts" :key="`${alert.rule}-${alert.kind}`">
                    <code class="font-mono">{{ alert.rule }}</code>
                    <span class="text-muted"> — {{ alert.message }}</span>
                </li>
            </ul>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <template #header>
                <h2 class="font-semibold">Rules that fired or are disabled inline</h2>
            </template>

            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="text-xs text-muted border-b border-default">
                        <tr>
                            <th class="text-left font-medium px-4 py-2">Rule</th>
                            <th class="text-right font-medium px-3 py-2">Hits</th>
                            <th class="text-right font-medium px-3 py-2">Last {{ windowDays }}d</th>
                            <th class="text-right font-medium px-3 py-2">Auto-fixed</th>
                            <th class="text-right font-medium px-3 py-2">Disabled</th>
                            <th class="text-left font-medium px-4 py-2">Projects</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-default">
                        <tr v-for="row in rows" :key="row.rule" class="hover:bg-elevated/40">
                            <td class="px-4 py-2 font-mono">{{ row.rule }}</td>
                            <td class="px-3 py-2 text-right tabular-nums">{{ row.usage.hits }}</td>
                            <td class="px-3 py-2 text-right tabular-nums">
                                {{ row.usage.recent }}
                            </td>
                            <td class="px-3 py-2 text-right tabular-nums">
                                {{ row.usage.fixable }}
                            </td>
                            <td class="px-3 py-2 text-right tabular-nums">
                                {{ row.usage.disabled }}
                            </td>
                            <td class="px-4 py-2 text-xs text-muted">
                                {{ topProjects(row.usage.projects) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </UCard>

        <UCard>
            <template #header>
                <div>
                    <h2 class="font-semibold">
                        Never fired: {{ quiet.length }} of {{ enabledCount }} enabled rules
                    </h2>
                    <p class="text-xs text-muted">
                        {{ watching }} Quiet can also mean the rule works: agents follow what the
                        docs say, or it guards something rare.
                    </p>
                </div>
            </template>

            <p class="font-mono text-xs text-muted leading-relaxed">
                {{ quietList }}
            </p>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { lintAlerts, neverFired } from "#shared/lintUsage.ts";
import type { LintUsage } from "#shared/types.ts";

interface Props {
    lint: LintUsage;
    windowDays: number;
}

const props = defineProps<Props>();

const alerts = computed(() => lintAlerts(props.lint));
const quiet = computed(() => neverFired(props.lint));
const quietList = computed(() => quiet.value.join(" · ") || "—");
const enabledCount = computed(
    () => Object.values(props.lint.rules).filter((r) => r.enabled).length,
);

const rows = computed(() =>
    Object.entries(props.lint.rules)
        .filter(([, usage]) => usage.hits > 0 || usage.disabled > 0)
        .map(([rule, usage]) => ({ rule, usage }))
        .sort((a, b) => b.usage.hits - a.usage.hits || b.usage.disabled - a.usage.disabled),
);

const watching = computed(() =>
    props.lint.since
        ? `Watching since ${props.lint.since}: nothing here means much until that's weeks ago.`
        : "Nothing recorded yet, so every rule is listed.",
);

const topProjects = (counts: Record<string, number>): string =>
    Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => `${name} ${count}`)
        .join(", ") || "—";
</script>
