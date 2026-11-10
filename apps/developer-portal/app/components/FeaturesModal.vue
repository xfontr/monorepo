<template>
    <UModal
        v-model:open="open"
        title="Features in this project"
        description="Set once, when the project is planned. Switching one off takes its blocks out of the map, and whatever needed them waits on what they needed instead."
    >
        <template #body>
            <ul class="flex flex-col divide-y divide-default">
                <li
                    v-for="feature in features"
                    :key="feature.id"
                    class="flex items-center gap-3 py-2.5"
                    :class="{ 'opacity-50': blockedBy[feature.id] }"
                >
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium">{{ feature.title }}</p>
                        <p class="text-xs text-muted">
                            {{ details[feature.id] }}
                        </p>
                    </div>
                    <USwitch
                        v-if="editable"
                        :model-value="feature.enabled"
                        :disabled="blockedBy[feature.id] !== undefined"
                        :aria-label="`${feature.title} in this project`"
                        @update:model-value="(on) => emit('toggle', feature.id, on)"
                    />
                    <span
                        v-else
                        class="text-xs"
                        :class="feature.enabled ? 'tone-good' : 'text-dimmed'"
                    >
                        {{ feature.enabled ? "On" : "Off" }}
                    </span>
                </li>
            </ul>
            <p v-if="!editable" class="mt-3 text-xs text-muted">
                Switch them under <code class="font-mono">pnpm dev</code>, which writes the project
                file.
            </p>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { Feature } from "#shared/workflows.ts";

interface Props {
    features: Feature[];
    editable?: boolean;
}

const { features, editable = false } = defineProps<Props>();
const emit = defineEmits<{ toggle: [feature: string, on: boolean] }>();
const open = defineModel<boolean>("open", { default: false });

/** A feature inside one that is off, such as comments without a blog, can't be switched on alone. */
const blockedBy = computed(() =>
    Object.fromEntries(
        features.flatMap((feature) => {
            const within = features.find(({ id }) => id === feature.within);
            return within && !within.enabled ? [[feature.id, within.title]] : [];
        }),
    ),
);

const details = computed(() =>
    Object.fromEntries(
        features.map((feature) => {
            const parts = [
                feature.blocks.length > 1 ? `${feature.blocks.join(", ")}` : feature.summary,
                blockedBy.value[feature.id] ? `needs ${blockedBy.value[feature.id]}` : "",
            ].filter(Boolean);

            return [feature.id, parts.join(" · ")];
        }),
    ),
);
</script>
