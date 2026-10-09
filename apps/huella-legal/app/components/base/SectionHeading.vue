<script setup lang="ts">
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    title: string;
    kicker?: string;
    action?: LinkAction;
    id?: string;
}

const props = defineProps<Props>();

const fallbackId = useId();
const headingId = computed<string>(() => props.id ?? fallbackId);
</script>

<template>
    <div
        class="flex flex-col gap-2 border-t-2 border-huella-slate-900 pt-4 sm:flex-row sm:items-end sm:justify-between"
    >
        <div>
            <p v-if="kicker" class="flex">
                <BaseKicker>{{ kicker }}</BaseKicker>
            </p>
            <h2
                :id="headingId"
                class="font-serif text-section text-highlighted md:text-h2"
                :class="kicker && 'mt-1'"
            >
                {{ title }}
            </h2>
        </div>
        <UButton
            v-if="action"
            variant="link"
            :label="action.label"
            :to="action.to"
            :aria-describedby="headingId"
            trailing-icon="i-lucide-arrow-right"
            class="-ml-3 self-start sm:-mr-3 sm:ml-0 sm:self-auto"
        />
    </div>
</template>
