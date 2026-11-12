<template>
    <div class="flex flex-col gap-5 text-sm">
        <div class="flex flex-wrap items-center gap-2">
            <StatusPill :label :tone />
            <span v-if="kindText" class="flex items-center gap-1 text-xs text-muted">
                <UIcon v-if="kindIconName" :name="kindIconName" class="size-3.5" />
                {{ kindText }}
            </span>
            <UBadge
                v-if="capability.extra"
                label="This project only"
                color="neutral"
                variant="subtle"
                size="sm"
            />
            <span v-if="groupOff" class="ml-auto text-xs text-dimmed">Off with {{ groupOff }}</span>
            <USwitch
                v-else-if="editable && capability.optional"
                :model-value="capability.enabled"
                size="sm"
                :label="capability.enabled ? 'On for this project' : 'Off for this project'"
                class="ml-auto"
                @update:model-value="(on) => emit('toggle', on)"
            />
            <span v-else-if="capability.optional" class="ml-auto text-xs text-dimmed"
                >Optional</span
            >
        </div>

        <p v-if="capability.summary" class="text-muted">{{ capability.summary }}</p>
        <p v-if="capability.note" class="text-muted italic">{{ capability.note }}</p>
        <p v-if="why" class="text-muted">
            {{ why }}
        </p>
        <code
            v-if="fileCommand"
            class="block rounded-md bg-elevated px-2 py-1 font-mono text-xs select-all"
            >{{ fileCommand }}</code
        >

        <section v-for="link in links" :key="link.title" class="flex flex-col gap-1.5">
            <h3 class="text-xs font-semibold tracking-wide text-dimmed uppercase">
                {{ link.title }}
            </h3>
            <ul class="flex flex-wrap gap-1.5">
                <li v-for="target in link.ids" :key="target">
                    <UButton
                        :label="titles[target] ?? target"
                        color="neutral"
                        variant="subtle"
                        size="xs"
                        @click="emit('select', target)"
                    />
                </li>
            </ul>
        </section>

        <section v-if="capability.issues.length > 0" class="flex flex-col gap-1.5">
            <h3 class="text-xs font-semibold tracking-wide text-dimmed uppercase">Tickets</h3>
            <ul class="flex flex-col gap-1">
                <li v-for="issue in capability.issues" :key="issue.number">
                    <a
                        :href="issue.url"
                        target="_blank"
                        class="flex items-start gap-2 hover:underline"
                    >
                        <UIcon
                            :name="issueIcon(issue)"
                            class="mt-0.5 size-3.5 shrink-0"
                            :class="delivered(issue) ? 'tone-good' : 'text-dimmed'"
                        />
                        <span class="font-mono text-xs text-dimmed">#{{ issue.number }}</span>
                        <span class="min-w-0 flex-1">{{ issue.title }}</span>
                        <span v-if="statusOf[issue.number]" class="shrink-0 text-xs text-muted">{{
                            statusOf[issue.number]
                        }}</span>
                    </a>
                </li>
            </ul>
        </section>

        <section v-if="activitySummary" class="flex flex-col gap-1.5">
            <h3 class="text-xs font-semibold tracking-wide text-dimmed uppercase">Activity</h3>
            <p class="text-muted">{{ activitySummary }}</p>
        </section>

        <section v-if="capability.reuse" class="flex flex-col gap-1.5">
            <h3 class="text-xs font-semibold tracking-wide text-dimmed uppercase">Start from</h3>
            <p v-if="capability.reuse" class="text-muted">
                {{ reuseLabel }}
                <code v-if="capability.reuse.from" class="font-mono text-xs break-all">{{
                    capability.reuse.from
                }}</code>
            </p>
        </section>

        <section v-if="capability.doneWhen.length > 0" class="flex flex-col gap-1.5">
            <h3 class="text-xs font-semibold tracking-wide text-dimmed uppercase">Done when</h3>
            <ul class="list-disc pl-4 text-muted">
                <li v-for="line in capability.doneWhen" :key="line">{{ line }}</li>
            </ul>
        </section>

        <section v-if="capability.lessons.length > 0" class="flex flex-col gap-1.5">
            <h3 class="text-xs font-semibold tracking-wide text-dimmed uppercase">Lessons</h3>
            <ul class="flex flex-col gap-1.5 text-muted">
                <li v-for="lesson in capability.lessons" :key="lesson.text">
                    {{ lesson.text }}
                    <span class="font-mono text-xs text-dimmed">
                        {{ lesson.issues.map((number) => `#${number}`).join(" ") }}
                    </span>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { CapabilityActivity } from "#layers/workflows/shared/workflowActivity.ts";
import {
    ticketStatus,
    type CapabilityView,
    type SnapshotIssue,
} from "#layers/workflows/shared/workflows.ts";

interface Props {
    capability: CapabilityView;
    /** The project id, so a block with nothing filed can show the command that files it. */
    project?: string | null;
    /** Capability id to its title, for the blocks it needs and unblocks. */
    titles?: Record<string, string>;
    editable?: boolean;
    activity?: CapabilityActivity | null;
    /** The title of the group holding this capability when that group is switched off. */
    groupOff?: string | null;
}

const {
    capability,
    project = null,
    titles = {},
    editable = false,
    activity = null,
    groupOff = null,
} = defineProps<Props>();
const emit = defineEmits<{ toggle: [on: boolean]; select: [capability: string] }>();

const label = computed(() => capabilityStateLabel(capability.state));
const tone = computed(() => capabilityStateTone(capability.state));
const kindText = computed(() =>
    capability.kind === "build" ? null : blockKindLabel(capability.kind),
);
const kindIconName = computed(() => blockKindIcon(capability.kind) ?? undefined);
const unfiled = computed(() => capability.issues.every(({ reason }) => reason === "not_planned"));
const fileCommand = computed(() =>
    project && unfiled.value && ["can-file", "waiting-on-you"].includes(capability.state)
        ? `pnpm workflow:file ${project} ${capability.id}`
        : null,
);
/** Why it sits where it does, in the words a reader acts on. */
const why = computed(() => {
    const waiting = capability.waitingOn.map((id) => titles[id] ?? id).join(", ");

    switch (capability.state) {
        case "waits":
            return `Not fileable yet: it waits on ${waiting}, which can still change what its tickets say.`;
        case "blocked":
            return waiting
                ? `Blocked: it waits on ${waiting}.`
                : "Blocked by an open ticket on GitHub.";
        case "can-file":
            return "Nothing it needs is undecided, so its tickets can be filed now.";
        case "waiting-on-you":
            return unfiled.value
                ? "Only you can approve this: file its ticket and close it, or settle it in the project file. Everything after it waits."
                : "Only you can close this, and everything after it waits.";
        case "ready":
            return "Nothing open blocks it, so an agent can take it.";
        default:
            return null;
    }
});
/** An open ticket's status, naming its open blockers when it has any. */
const statusOf = computed(() =>
    Object.fromEntries(
        capability.issues
            .filter((issue) => issue.state === "open")
            .map((issue) => {
                const status = ticketStatus(issue);
                const blockers = issue.blockedBy
                    .filter((blocker) => blocker.open)
                    .map((blocker) => `#${blocker.number}`);

                return [
                    issue.number,
                    status === "blocked"
                        ? `Blocked by ${blockers.join(" ")}`
                        : ticketStatusLabel(status),
                ];
            }),
    ),
);

const links = computed(() =>
    [
        { title: "Needs", ids: capability.needs },
        { title: "Unblocks", ids: capability.unblocks },
    ].filter(({ ids }) => ids.length > 0),
);
const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

const activitySummary = computed(() => {
    if (!activity || capability.issues.length === 0) return null;
    if (activity.commits === 0) return "No commit names its tickets yet.";

    return `${plural(activity.commits, "commit")} on ${plural(activity.days, "day")} across ${plural(activity.tickets, "ticket")}, last on ${calendarDay(activity.lastDay!)}.`;
});

const reuseLabel = computed(() => (capability.reuse ? reusePlanLabel(capability.reuse.plan) : ""));

const delivered = (issue: SnapshotIssue): boolean =>
    issue.state === "closed" && issue.reason !== "not_planned";

const issueIcon = (issue: SnapshotIssue): string => {
    if (issue.state === "open") return "i-lucide-circle-dot";
    return issue.reason === "not_planned" ? "i-lucide-circle-slash" : "i-lucide-circle-check";
};
</script>
