import type { ComputedRef } from "vue";
import type { ProjectView } from "#layers/workflows/shared/workflows.ts";

/** One block, picked anywhere, drives the cards, the skyline and the graph. */
export const useCapabilitySelection = (view: ComputedRef<ProjectView | undefined>) => {
    const chosenId = ref<string | null>(null);
    /** What was picked, else what needs doing first, else the last block on the map. */
    const selectedId = computed(() => {
        const capabilities = view.value?.capabilities ?? [];
        const isOn = (capabilityId: string | null) =>
            capabilities.some(({ id: other, state }) => other === capabilityId && state !== "off");

        if (isOn(chosenId.value)) return chosenId.value;
        return (
            view.value?.left[0]?.id ??
            capabilities.findLast(({ state }) => state !== "off")?.id ??
            null
        );
    });
    const selected = computed(() =>
        view.value?.capabilities.find((capability) => capability.id === selectedId.value),
    );

    const stageId = ref<string | null>(null);
    const activeIndex = computed(() => {
        const stages = view.value?.stages ?? [];
        const wanted = stageId.value ?? selected.value?.stage;
        return Math.max(
            stages.findIndex((stage) => stage.id === wanted),
            0,
        );
    });
    const activeStage = computed(() => view.value?.stages[activeIndex.value]);
    const selectedStage = computed(
        () => view.value?.stages.find((stage) => stage.id === selected.value?.stage)?.title,
    );

    const select = (capabilityId: string) => {
        chosenId.value = capabilityId;
        stageId.value = null;
    };

    return {
        chosenId,
        selectedId,
        selected,
        stageId,
        activeIndex,
        activeStage,
        selectedStage,
        select,
    };
};
