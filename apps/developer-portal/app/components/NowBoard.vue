<template>
    <section class="flex flex-col gap-3" aria-labelledby="now-heading">
        <h2 id="now-heading" class="text-sm font-semibold">Now</h2>

        <div class="grid gap-3 md:grid-cols-3">
            <div
                v-for="column in columns"
                :key="column.key"
                :data-column="column.key"
                class="flex min-w-0 flex-col gap-2 rounded-2xl border border-default bg-elevated/30 p-3"
            >
                <h3 class="flex items-center gap-2 text-sm font-semibold">
                    <UIcon :name="column.icon" class="size-4 text-dimmed" />
                    {{ column.title }}
                    <span class="font-normal text-muted tabular-nums">{{
                        column.tickets.length
                    }}</span>
                </h3>
                <p class="text-xs text-muted">{{ column.hint }}</p>

                <ul v-if="column.tickets.length > 0" class="flex flex-col gap-2">
                    <li v-for="ticket in column.tickets" :key="ticket.issue.number">
                        <a
                            :href="ticket.issue.url"
                            target="_blank"
                            class="flex items-baseline gap-2 text-sm hover:underline"
                        >
                            <span class="font-mono text-xs text-dimmed"
                                >#{{ ticket.issue.number }}</span
                            >
                            <span class="min-w-0">{{ ticket.issue.title }}</span>
                        </a>
                        <p class="flex flex-wrap gap-x-2 pl-8 text-xs text-muted">
                            <button
                                v-if="ticket.capability"
                                type="button"
                                class="hover:text-default hover:underline"
                                @click="emit('select', ticket.capability)"
                            >
                                {{ titles[ticket.capability] ?? ticket.capability }}
                            </button>
                            <span v-if="ticket.unblocks > 0" class="tabular-nums"
                                >unblocks {{ ticket.unblocks }}</span
                            >
                        </p>
                    </li>
                </ul>
                <p v-else class="text-xs text-dimmed">Nothing here.</p>
            </div>
        </div>

        <details
            v-if="now.blocked.length > 0"
            class="rounded-2xl border border-default px-3 py-2 text-sm"
        >
            <summary class="cursor-pointer font-semibold">
                Blocked
                <span class="font-normal text-muted tabular-nums">{{ now.blocked.length }}</span>
                <span class="font-normal text-xs text-muted">
                    · open until what they're blocked by closes</span
                >
            </summary>
            <ul class="mt-2 flex flex-col gap-1.5">
                <li
                    v-for="ticket in now.blocked"
                    :key="ticket.issue.number"
                    class="flex flex-wrap items-baseline gap-x-2"
                >
                    <a :href="ticket.issue.url" target="_blank" class="hover:underline">
                        <span class="font-mono text-xs text-dimmed"
                            >#{{ ticket.issue.number }}</span
                        >
                        {{ ticket.issue.title }}
                    </a>
                    <span class="text-xs text-muted">
                        by {{ ticket.blockers.map((number) => `#${number}`).join(" ") }}
                    </span>
                </li>
            </ul>
        </details>
    </section>
</template>

<script setup lang="ts">
import type { Now } from "#shared/workflows.ts";

interface Props {
    now: Now;
    /** Capability id to its title, so a ticket names the block it belongs to. */
    titles: Record<string, string>;
}

const { now, titles } = defineProps<Props>();
const emit = defineEmits<{ select: [capability: string] }>();

const columns = computed(() => [
    {
        key: "waiting",
        title: "Waiting on you",
        icon: "i-lucide-user-round",
        hint: "Decisions and owner-only steps; they hold back everything after them.",
        tickets: now.waiting,
    },
    {
        key: "ready",
        title: "Ready",
        icon: "i-lucide-play",
        hint: "Nothing open blocks them. The ones that unblock the most come first.",
        tickets: now.ready,
    },
    {
        key: "in-flight",
        title: "In flight",
        icon: "i-lucide-git-branch",
        hint: "A branch is linked on the issue.",
        tickets: now.inFlight,
    },
]);
</script>
