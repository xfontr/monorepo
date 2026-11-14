<template>
    <div class="grid gap-4 lg:grid-cols-2">
        <UCard>
            <template #header>
                <h2 class="font-semibold">Scripts: how often vs how often it fails</h2>
                <p class="text-xs text-muted">
                    One dot per script run in the window. Dashed lines are the alert thresholds:
                    {{ MIN_RUNS }} runs, {{ failingPercent }}% failing.
                </p>
            </template>

            <QuadrantChart
                :chart="scripts"
                :kinds="CALLER_KINDS"
                :quadrants="scriptCorners"
                x-label="Runs in the window, log scale"
                y-label="Runs that failed"
            />

            <p v-if="idle.length > 0" class="mt-4 text-xs text-muted">
                Not plotted, no run in the window:
                <span class="font-mono">{{ idleList }}</span>
            </p>
        </UCard>

        <UCard>
            <template #header>
                <h2 class="font-semibold">
                    Lint rules: how often it fires vs how often it's switched off
                </h2>
                <p class="text-xs text-muted">
                    Hits on agent edits against <code>eslint-disable</code> comments. Dashed lines:
                    {{ FOUGHT_DISABLES }} disables, {{ noisyPercent }}% of all hits.
                </p>
            </template>

            <QuadrantChart
                :chart="rules"
                :kinds="FIX_KINDS"
                :quadrants="ruleCorners"
                x-label="Hits in the window, log scale"
                y-label="Disabled inline"
            />
        </UCard>
    </div>
</template>

<script setup lang="ts">
import type { UsageArtifact } from "#layers/snapshot/shared/types.ts";
import { FOUGHT_DISABLES, NOISY_SHARE } from "#layers/telemetry/shared/lintUsage.ts";
import { FAILING_RATE, MIN_RUNS } from "#layers/telemetry/shared/usage.ts";
import {
    ruleQuadrants,
    scriptQuadrants,
    scriptRows,
    type CallerMix,
    type FixKind,
} from "#layers/telemetry/shared/usageView.ts";

interface Props {
    usage: UsageArtifact;
}

const { usage } = defineProps<Props>();

const failingPercent = Math.round(FAILING_RATE * 100);
const noisyPercent = Math.round(NOISY_SHARE * 100);

const CALLER_KINDS = {
    agents: { label: "Agents only", color: "var(--usage-agent)" },
    both: { label: "Both", color: "var(--usage-both)" },
    people: { label: "People only", color: "var(--usage-person)" },
} as const satisfies Record<CallerMix, { label: string; color: string }>;

const FIX_KINDS = {
    manual: { label: "Needs a manual fix", color: "var(--usage-rule)" },
    auto: { label: "Always auto-fixed", color: "var(--usage-rule)", hollow: true },
} as const satisfies Record<FixKind, { label: string; color: string; hollow?: boolean }>;

const scriptCorners = [
    { corner: "top-right", label: "Used and failing · fix first", bad: true },
    { corner: "top-left", label: "Rare and failing" },
    { corner: "bottom-left", label: "Rarely run · still needed?" },
    { corner: "bottom-right", label: "Workhorses" },
] as const;

const ruleCorners = [
    { corner: "top-left", label: "Switched off, never fires · rule or code wrong", bad: true },
    { corner: "top-right", label: "Fires and fought" },
    { corner: "bottom-right", label: "Noisy · tell agents, or narrow it" },
] as const;

const rows = computed(() => scriptRows(usage));
const scripts = computed(() => scriptQuadrants(rows.value));
const rules = computed(() => ruleQuadrants(usage.lint));
const idle = computed(() => rows.value.filter((row) => row.runs === 0));
const idleList = computed(() =>
    idle.value
        .map((row) => {
            const when = row.last ? `last run ${row.last.slice(0, 10)}` : "never run";

            return `${row.name} (${when})`;
        })
        .join(" · "),
);
</script>
