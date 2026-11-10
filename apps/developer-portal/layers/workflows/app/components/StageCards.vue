<template>
    <section :id="`stage-${stage.id}`" class="flex flex-col gap-4">
        <header class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 class="flex items-center gap-2 text-2xl font-bold">
                <span
                    class="size-3 rounded-full"
                    :style="{ background: color }"
                    aria-hidden="true"
                />
                {{ stage.title }}
            </h2>
            <p class="text-sm text-muted tabular-nums">
                {{ stage.progress.done }} of {{ stage.progress.total }}
            </p>
        </header>

        <ul class="cards grid gap-4">
            <li v-for="capability in shown" :key="capability.id" class="relative flex">
                <button
                    type="button"
                    class="relative flex min-h-24 flex-1 flex-col gap-1 overflow-hidden rounded-2xl border bg-elevated/50 py-4 pr-11 pl-6 text-left transition hover:-translate-y-0.5 hover:bg-elevated"
                    :class="
                        capability.id === selected
                            ? 'border-inverted ring-1 ring-inverted'
                            : 'border-default'
                    "
                    :style="{ '--state': capabilityColor(capability.state) }"
                    :aria-pressed="capability.id === selected"
                    @click="emit('select', capability.id)"
                >
                    <span class="absolute inset-y-0 left-0 w-1.5 bg-(--state)" aria-hidden="true" />
                    <span class="flex items-start gap-1.5 text-base/tight font-semibold">
                        <UIcon
                            v-if="kindIcons[capability.id]"
                            :name="kindIcons[capability.id]!"
                            class="mt-0.5 size-4 shrink-0 text-dimmed"
                        />
                        {{ capability.title }}
                    </span>
                    <span class="text-xs font-semibold text-(--state)">{{
                        capabilityStateLabel(capability.state)
                    }}</span>
                    <span v-if="waiting[capability.id]" class="text-xs text-muted">
                        waits on {{ waiting[capability.id] }}
                    </span>
                    <span
                        v-if="activityOf[capability.id]?.quiet"
                        class="tone-warn flex items-center gap-1 text-xs"
                    >
                        <UIcon name="i-lucide-moon" class="size-3.5" />
                        {{ activityOf[capability.id]?.quiet }}
                    </span>
                    <span class="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                        <span
                            v-for="issue in capability.issues"
                            :key="issue.number"
                            class="size-2.5 rounded-full"
                            :style="{ background: stateColor(ticketStatus(issue)) }"
                            :title="`#${issue.number} ${issue.title} · ${ticketStatusLabel(ticketStatus(issue))}`"
                        />
                        <span v-if="capability.unblockCount > 0" class="text-xs text-muted">
                            unblocks {{ capability.unblockCount }}
                        </span>
                        <ActivitySpark
                            v-if="activityOf[capability.id]?.weeks"
                            :weeks="activityOf[capability.id]!.weeks!"
                            :peak="activityPeak"
                            :label="activityOf[capability.id]!.label"
                            class="ml-auto"
                            :style="{ color }"
                        />
                    </span>
                </button>
                <UButton
                    icon="i-lucide-info"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="absolute top-3 right-3 rounded-full"
                    :aria-label="`Details for ${capability.title}`"
                    @click="emit('details', capability.id)"
                />
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import type { CapabilityActivity } from "#layers/workflows/shared/workflowActivity.ts";
import { ticketStatus, type StageView } from "#layers/workflows/shared/workflows.ts";

interface Props {
    stage: StageView;
    /** The stage's place in the template, which picks its colour. */
    index: number;
    selected?: string | null;
    /** Capability id to its title, for the blocks a card waits on. */
    titles?: Record<string, string>;
    /** Keyed by capability id; absent when no commit names any of the project's tickets. */
    activity?: Record<string, CapabilityActivity> | null;
    /** The busiest week any capability had, so every card's line shares one scale. */
    activityPeak?: number;
}

const {
    stage,
    index,
    selected = null,
    titles = {},
    activity = null,
    activityPeak = 1,
} = defineProps<Props>();
const emit = defineEmits<{ select: [capability: string]; details: [capability: string] }>();

const color = computed(() => stageColor(index));

/** A switched-off block isn't part of this project, so it has no card. */
const shown = computed(() => stage.capabilities.filter(({ state }) => state !== "off"));

const kindIcons = computed(() =>
    Object.fromEntries(shown.value.map(({ id, kind }) => [id, blockKindIcon(kind)])),
);

const waiting = computed(() =>
    Object.fromEntries(
        shown.value
            .filter(
                ({ state, waitingOn }) => ["blocked", "waits"].includes(state) && waitingOn.length,
            )
            .map(({ id, waitingOn }) => [
                id,
                waitingOn.map((need) => titles[need] ?? need).join(", "),
            ]),
    ),
);

/** Only a capability with tickets gets a line, so an unstarted one stays quiet. */
const activityOf = computed(() =>
    Object.fromEntries(
        shown.value.flatMap((capability) => {
            const found = activity?.[capability.id];
            if (!found || capability.issues.length === 0) return [];

            return [
                [
                    capability.id,
                    {
                        weeks: found.days > 0 ? found.weeks : null,
                        label: `Active on ${found.days} days, last on ${found.lastDay ? calendarDay(found.lastDay) : "never"}`,
                        quiet: found.quietSince
                            ? `Quiet since ${calendarDay(found.quietSince)}`
                            : null,
                    },
                ],
            ];
        }),
    ),
);
</script>

<style scoped>
.cards {
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}
</style>
