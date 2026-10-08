<script setup lang="ts">
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    title: string
    action?: LinkAction
}

defineProps<Props>();

const heading = useTemplateRef("heading");

onMounted(() => heading.value?.focus());
</script>

<template>
    <div
        class="flex flex-col items-start gap-4 rounded-sm border border-huella-teal-200 bg-huella-teal-50 p-6 md:p-8"
    >
        <span class="flex size-11 items-center justify-center rounded-full bg-huella-teal-600 text-white">
            <UIcon
                name="i-lucide-check"
                class="size-5"
            />
        </span>
        <h3
            ref="heading"
            tabindex="-1"
            class="font-serif text-h3 text-highlighted outline-none"
        >
            {{ title }}
        </h3>
        <p
            v-if="$slots.default"
            class="max-w-measure font-serif text-base leading-relaxed text-toned"
        >
            <slot />
        </p>
        <UButton
            v-if="action"
            variant="link"
            :label="action.label"
            :to="action.to"
            class="-ml-3"
        />
    </div>
</template>
