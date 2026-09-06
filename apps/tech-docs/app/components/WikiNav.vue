<script setup lang="ts">
import type { SpikeStatus } from "../../shared/types.ts";
import type { WikiGroup, WikiSection } from "../../shared/wiki.ts";

const { sections, current = "", spikeStatuses = {} } = defineProps<{
    sections: WikiSection[]
    current?: string
    /** Keyed by path — the one thing this component needs that a path alone can't tell it. */
    spikeStatuses?: Record<string, SpikeStatus>
}>();

function holdsCurrent(group: WikiGroup): boolean {
    return group.entries.some((entry) => entry.path === current);
}

/**
 * Every group here — a project, or a docs subdirectory — is that directory's own README first and
 * whatever else it holds after, so the group label doubles as a link to it. Without this, a project
 * a reader isn't already inside is a name they can only toggle open, never go to.
 */
function overviewPath(group: WikiGroup): string | null {
    return group.entries.find((entry) => entry.label === "Overview")?.path ?? null;
}

/** Every group starts folded except the one the reader is already inside — that one has to show where they are. */
function opensByDefault(group: WikiGroup): boolean {
    return holdsCurrent(group);
}

// Records which groups a click has flipped away from their default, rather than which are open —
// so a group that opens itself because it holds the current page still folds on a click, and one
// left alone keeps tracking `holdsCurrent` as the reader navigates rather than freezing at load.
const toggled = ref(new Set<string>());

function isOpen(section: WikiSection, group: WikiGroup): boolean {
    const key = `${section.id}/${group.key}`;
    const isDefault = opensByDefault(group);

    return toggled.value.has(key) ? !isDefault : isDefault;
}

function toggle(section: WikiSection, group: WikiGroup): void {
    const key = `${section.id}/${group.key}`;
    const next = new Set(toggled.value);

    if (next.has(key)) next.delete(key);
    else next.add(key);

    toggled.value = next;
}

function statusOf(path: string): SpikeStatus | null {
    return spikeStatuses[path] ?? null;
}

/** `tone-neutral` renders nothing in `main.css`, so "won't implement" reads as an unfilled dot on purpose. */
function statusToneClass(status: SpikeStatus | null): string {
    if (!status) return "";

    const tone = spikeStatusTone(status);

    return tone === "neutral" ? "" : `tone-${tone}`;
}

function statusTitle(status: SpikeStatus | null): string | undefined {
    return status ? spikeStatusLabel(status) : undefined;
}
</script>

<template>
    <nav class="flex flex-col gap-5 text-sm">
        <div
            v-for="section in sections"
            :key="section.id"
            class="flex flex-col gap-1"
        >
            <div class="flex items-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-dimmed">
                <UIcon
                    :name="section.icon"
                    class="size-3.5"
                />
                {{ section.label }}
            </div>

            <div
                v-for="group in section.groups"
                :key="group.key"
                class="flex flex-col"
            >
                <div class="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-elevated/50 transition-colors">
                    <button
                        type="button"
                        class="shrink-0 flex items-center"
                        @click="toggle(section, group)"
                    >
                        <UIcon
                            :name="isOpen(section, group) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                            class="size-3 text-dimmed"
                        />
                    </button>

                    <NuxtLink
                        v-if="overviewPath(group)"
                        :to="`/docs${overviewPath(group)}`"
                        class="truncate font-mono flex-1 hover:text-primary transition-colors"
                    >
                        {{ group.label }}
                    </NuxtLink>
                    <button
                        v-else
                        type="button"
                        class="truncate font-mono flex-1 text-left"
                        @click="toggle(section, group)"
                    >
                        {{ group.label }}
                    </button>
                </div>

                <NuxtLink
                    v-for="entry in isOpen(section, group) ? group.entries : []"
                    :key="entry.path"
                    :to="`/docs${entry.path}`"
                    class="flex items-center gap-2 pl-6 pr-2 py-1 rounded-md hover:bg-elevated/50 transition-colors"
                    :class="entry.path === current ? 'bg-elevated/70 text-primary font-medium' : 'text-default'"
                >
                    <UIcon
                        :name="kindIcon(entry.kind)"
                        class="size-3.5 shrink-0 text-dimmed"
                    />
                    <span class="truncate flex-1">{{ entry.label }}</span>
                    <span
                        v-if="statusOf(entry.path)"
                        class="size-1.5 rounded-full shrink-0 bg-current"
                        :class="statusToneClass(statusOf(entry.path)) || 'text-dimmed'"
                        :title="statusTitle(statusOf(entry.path))"
                    />
                </NuxtLink>
            </div>
        </div>
    </nav>
</template>
