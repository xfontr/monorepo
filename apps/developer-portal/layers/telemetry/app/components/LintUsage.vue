<template>
    <div class="flex flex-col gap-4">
        <UAlert
            color="neutral"
            variant="subtle"
            icon="i-lucide-bot"
            title="Lint rules: agent edits only"
            description="These counts come from the hook that lints every file an agent edits. Your own edits are fixed by the editor on save and never counted, so a rule that only catches people reads as quiet here."
        />

        <UCard variant="flush">
            <template #header>
                <div>
                    <h2 class="font-semibold">Lint rules × projects</h2>
                    <p class="text-xs text-muted">
                        Hits per project. Darker means more; the last two columns say whether the
                        rule costs anything.
                    </p>
                </div>
            </template>

            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rule</th>
                            <th
                                v-for="project in table.projects"
                                :key="project"
                                class="w-32 min-w-32 text-center whitespace-nowrap"
                            >
                                {{ project }}
                            </th>
                            <th class="numeric">Total</th>
                            <th class="numeric whitespace-nowrap">Auto-fixed</th>
                            <th class="numeric whitespace-nowrap">Disabled inline</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.rule">
                            <td class="font-mono text-xs whitespace-nowrap">{{ row.rule }}</td>
                            <td
                                v-for="cell in row.cells"
                                :key="cell.project"
                                class="w-32 min-w-32 p-0.5"
                            >
                                <div
                                    class="flex h-8 items-center justify-center rounded-xs text-xs tabular-nums"
                                    :style="cell.style"
                                >
                                    {{ cell.count }}
                                </div>
                            </td>
                            <td class="numeric font-semibold">{{ row.hits }}</td>
                            <td class="numeric text-xs text-muted">{{ row.fixed }}</td>
                            <td
                                class="numeric text-xs"
                                :class="row.fought && 'tone-bad font-semibold'"
                            >
                                {{ row.disabled }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <template #footer>
                <div class="flex flex-col gap-2">
                    <div class="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 class="text-sm font-semibold">
                            Never fired: {{ quiet.length }} of {{ enabledCount }} enabled rules
                        </h2>
                        <UButton
                            v-if="quiet.length > 0"
                            variant="link"
                            size="xs"
                            :label="showQuiet ? 'Hide the list' : 'Show the list'"
                            @click="showQuiet = !showQuiet"
                        />
                    </div>
                    <p class="text-xs text-muted">
                        {{ watching }} Quiet can also mean the rule works: agents follow what the
                        docs say, or it guards something rare.
                    </p>
                    <p v-if="showQuiet" class="font-mono text-xs/relaxed text-muted">
                        {{ quietList }}
                    </p>
                </div>
            </template>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { FOUGHT_DISABLES, neverFired } from "#layers/telemetry/shared/lintUsage.ts";
import { lintTable } from "#layers/telemetry/shared/usageView.ts";
import type { LintUsage } from "#layers/snapshot/shared/types.ts";

interface Props {
    lint: LintUsage;
}

const props = defineProps<Props>();

const showQuiet = ref(false);

const table = computed(() => lintTable(props.lint));
const quiet = computed(() => neverFired(props.lint));
const quietList = computed(() => quiet.value.join(" · "));
const enabledCount = computed(
    () => Object.values(props.lint.rules).filter((r) => r.enabled).length,
);

const rows = computed(() => {
    const busiest = Math.max(1, ...table.value.rows.flatMap((row) => row.projects));

    return table.value.rows.map((row) => ({
        rule: row.rule,
        hits: row.hits || "—",
        fixed: row.hits ? `${percentOf(row.fixable, row.hits)}%` : "—",
        disabled: row.disabled || "—",
        fought: row.disabled >= FOUGHT_DISABLES,
        cells: table.value.projects.map((project, index) => {
            const count = row.projects[index] ?? 0;

            return {
                project,
                count: count || "",
                style: { background: heatColor("--usage-hits", count, busiest) },
            };
        }),
    }));
});

const watching = computed(() =>
    props.lint.since
        ? `Watching since ${props.lint.since}: nothing here means much until that's weeks ago.`
        : "Nothing recorded yet, so every rule is listed.",
);
</script>
