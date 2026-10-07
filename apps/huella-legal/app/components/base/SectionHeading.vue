<script setup lang="ts">
import type { LinkAction } from "~/types/LinkAction";

interface Props {
    title: string
    kicker?: string
    action?: LinkAction
    id?: string
}

const props = withDefaults(defineProps<Props>(), {
    kicker: undefined,
    action: undefined,
    id: undefined,
});

const fallbackId = useId();
const headingId = computed<string>(() => props.id ?? fallbackId);
</script>

<template>
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t-2 border-huella-slate-900 pt-4">
        <div>
            <p
                v-if="kicker"
                class="flex"
            >
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
            class="-mr-3"
        />
    </div>
</template>
