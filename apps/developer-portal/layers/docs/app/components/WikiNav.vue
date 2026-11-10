<template>
    <nav class="flex flex-col gap-5 text-sm">
        <div v-for="section in sections" :key="section.id" class="flex flex-col gap-1">
            <div
                class="flex items-center gap-1.5 px-2 text-2xs font-medium tracking-wide text-dimmed uppercase"
            >
                <UIcon :name="section.icon" class="size-3.5" />
                {{ section.label }}
            </div>

            <div v-for="group in section.groups" :key="group.key" class="flex flex-col">
                <div
                    class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-elevated/50"
                >
                    <button
                        type="button"
                        class="flex shrink-0 items-center"
                        @click="toggle(section, group)"
                    >
                        <UIcon
                            :name="
                                isOpen(section, group)
                                    ? 'i-lucide-chevron-down'
                                    : 'i-lucide-chevron-right'
                            "
                            class="size-3 text-dimmed"
                        />
                    </button>

                    <NuxtLink
                        v-if="overviewPath(group)"
                        :to="`/docs${overviewPath(group)}`"
                        class="flex-1 truncate font-mono transition-colors hover:text-primary"
                    >
                        {{ group.label }}
                    </NuxtLink>
                    <button
                        v-else
                        type="button"
                        class="flex-1 truncate text-left font-mono"
                        @click="toggle(section, group)"
                    >
                        {{ group.label }}
                    </button>
                </div>

                <NuxtLink
                    v-for="entry in isOpen(section, group) ? group.entries : []"
                    :key="entry.path"
                    :to="`/docs${entry.path}`"
                    class="flex items-center gap-2 rounded-md py-1 pr-2 pl-6 transition-colors hover:bg-elevated/50"
                    :class="
                        entry.path === current
                            ? 'bg-elevated font-medium text-primary'
                            : 'text-default'
                    "
                >
                    <UIcon :name="kindIcon(entry.kind)" class="size-3.5 shrink-0 text-dimmed" />
                    <span class="flex-1 truncate">{{ entry.label }}</span>
                </NuxtLink>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import type { WikiGroup, WikiSection } from "#layers/docs/shared/wiki.ts";

interface Props {
    sections: WikiSection[];
    current?: string;
}

const { sections, current = "" } = defineProps<Props>();

const holdsCurrent = (group: WikiGroup): boolean =>
    group.entries.some((entry) => entry.path === current);

/**
 * Every group here — a project, or a docs subdirectory — is that directory's own README first and
 * whatever else it holds after, so the group label doubles as a link to it. Without this, a project
 * a reader isn't already inside is a name they can only toggle open, never go to.
 */
const overviewPath = (group: WikiGroup): string | null =>
    group.entries.find((entry) => entry.label === "Overview")?.path ?? null;

/** Every group starts folded except the one the reader is already inside — that one has to show where they are. */
const opensByDefault = (group: WikiGroup): boolean => holdsCurrent(group);

// Records which groups a click has flipped away from their default, rather than which are open —
// so a group that opens itself because it holds the current page still folds on a click, and one
// left alone keeps tracking `holdsCurrent` as the reader navigates rather than freezing at load.
const toggled = ref(new Set<string>());

const isOpen = (section: WikiSection, group: WikiGroup): boolean => {
    const key = `${section.id}/${group.key}`;
    const isDefault = opensByDefault(group);

    return toggled.value.has(key) ? !isDefault : isDefault;
};

const toggle = (section: WikiSection, group: WikiGroup): void => {
    const key = `${section.id}/${group.key}`;
    const next = new Set(toggled.value);

    if (next.has(key)) next.delete(key);
    else next.add(key);

    toggled.value = next;
};
</script>
