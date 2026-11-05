<template>
    <div
        class="flex flex-col items-start gap-4 rounded-sm border border-secondary-200 bg-secondary-50 p-6 md:p-8"
    >
        <span
            class="flex size-11 items-center justify-center rounded-full bg-secondary-600 text-inverted"
        >
            <UIcon name="i-lucide-check" class="size-5" />
        </span>
        <component
            :is="`h${level}`"
            ref="heading"
            tabindex="-1"
            class="font-serif text-h3 text-highlighted outline-none"
        >
            {{ title }}
        </component>
        <p v-if="$slots.default" class="max-w-measure font-serif text-base/relaxed text-toned">
            <slot />
        </p>
        <UButton v-if="action" variant="link" :label="action.label" :to="action.to" class="-ml-3" />
    </div>
</template>

<script setup lang="ts">
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    title: string;
    action?: LinkAction;
    level?: 2 | 3 | 4;
}

withDefaults(defineProps<Props>(), { level: 3 });

const heading = useTemplateRef<HTMLHeadingElement>("heading");

onMounted(() => heading.value?.focus());
</script>
