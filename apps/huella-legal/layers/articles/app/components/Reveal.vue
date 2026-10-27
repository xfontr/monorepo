<script setup lang="ts" generic="T">
interface Props {
    items: T[];
    limit: number;
    label: string;
}

const props = defineProps<Props>();

const expanded = ref<boolean>(false);
const root = useTemplateRef("root");

const visibleItems = computed<T[]>(() =>
    expanded.value ? props.items : props.items.slice(0, props.limit),
);

// The button unmounts as it is pressed, so focus moves to the first item it revealed
const showAll = async (): Promise<void> => {
    expanded.value = true;
    await nextTick();
    // Terrible practice, but for now it's adjusted to our needs
    root.value?.querySelectorAll("a")[props.limit]?.focus();
};
</script>

<template>
    <div ref="root">
        <slot :items="visibleItems" />

        <div v-if="visibleItems.length < items.length" class="mt-10 flex justify-center">
            <UButton
                variant="outline"
                color="neutral"
                :label
                trailing-icon="i-lucide-chevron-down"
                @click="showAll"
            />
        </div>
    </div>
</template>
