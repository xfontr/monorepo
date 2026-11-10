<template>
    <div
        ref="viewport"
        class="group relative h-144 touch-none overflow-hidden rounded-xl bg-default select-none"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown="press"
        @pointermove="move"
        @pointerup="release"
        @pointercancel="release"
        @wheel="wheel"
    >
        <div
            class="absolute top-0 left-0 origin-top-left"
            :class="{ 'transition-transform duration-500 ease-out': easing }"
            :style="{
                width: `${layout.width}px`,
                height: `${layout.height}px`,
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.k})`,
            }"
        >
            <svg
                class="absolute inset-0 overflow-visible"
                :width="layout.width"
                :height="layout.height"
                aria-hidden="true"
            >
                <defs>
                    <marker
                        v-for="tone in ['lit', 'dim']"
                        :id="`arrow-${tone}-${uid}`"
                        :key="tone"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="7"
                        markerHeight="7"
                        orient="auto-start-reverse"
                    >
                        <path
                            d="M0,0 L10,5 L0,10 z"
                            :fill="
                                tone === 'lit'
                                    ? 'var(--ui-text-highlighted)'
                                    : 'var(--ui-border-accented)'
                            "
                        />
                    </marker>
                </defs>
                <path
                    v-for="edge in layout.edges"
                    :key="edge.key"
                    :d="edge.path"
                    fill="none"
                    :stroke="
                        litEdge(edge) ? 'var(--ui-text-highlighted)' : 'var(--ui-border-accented)'
                    "
                    :stroke-width="litEdge(edge) ? 2 : 1.25"
                    :opacity="litEdge(edge) ? 0.9 : 0.5"
                    :marker-end="`url(#arrow-${litEdge(edge) ? 'lit' : 'dim'}-${uid})`"
                />
            </svg>

            <div
                v-for="node in layout.nodes"
                :key="node.id"
                class="absolute flex transition"
                :class="relation[node.id] === undefined && 'opacity-25 grayscale'"
                :style="{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${NODE_WIDTH}px`,
                    height: `${NODE_HEIGHT}px`,
                    '--state': capabilityColor(node.capability.state),
                }"
            >
                <button
                    type="button"
                    :data-node="node.id"
                    class="relative flex flex-1 flex-col justify-center gap-0.5 overflow-hidden rounded-xl border bg-default py-2 pr-9 pl-4 text-left"
                    :class="
                        node.id === selected
                            ? 'border-inverted ring-2 ring-inverted'
                            : 'border-(--state)'
                    "
                    :aria-pressed="node.id === selected"
                    :aria-label="`${node.capability.title}, ${capabilityStateLabel(node.capability.state)}`"
                    @click="click(node.id)"
                >
                    <span
                        class="absolute inset-y-0 left-0 w-1.5"
                        :style="{ background: stageColors[node.capability.stage] }"
                        aria-hidden="true"
                    />
                    <span
                        class="flex items-center gap-1 truncate text-xs/tight font-semibold text-highlighted"
                    >
                        <UIcon
                            v-if="node.icon"
                            :name="node.icon"
                            class="size-3.5 shrink-0 text-dimmed"
                        />
                        <span class="truncate">{{ node.capability.title }}</span>
                    </span>
                    <span class="truncate text-2xs font-medium text-(--state)">
                        {{ capabilityStateLabel(node.capability.state) }}
                        <span v-if="relation[node.id]" class="text-muted">
                            · {{ relation[node.id] }}</span
                        >
                    </span>
                </button>
                <UButton
                    icon="i-lucide-info"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full"
                    :aria-label="`Details for ${node.capability.title}`"
                    @click="details(node.id)"
                />
            </div>
        </div>

        <div
            class="absolute top-3 right-3 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
            @pointerdown.stop
        >
            <UButton
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                size="sm"
                aria-label="Zoom in"
                @click="zoomBy(1.25)"
            />
            <UButton
                icon="i-lucide-minus"
                color="neutral"
                variant="outline"
                size="sm"
                aria-label="Zoom out"
                @click="zoomBy(0.8)"
            />
            <UButton
                icon="i-lucide-locate-fixed"
                color="neutral"
                variant="outline"
                size="sm"
                aria-label="Fit the selected path"
                @click="fit(true)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CapabilityView, StageView } from "#layers/workflows/shared/workflows.ts";

interface Props {
    /** Every block in the project; switched-off ones are left out of the map. */
    capabilities: CapabilityView[];
    stages: StageView[];
    selected?: string | null;
}

const { capabilities, stages, selected = null } = defineProps<Props>();
const emit = defineEmits<{ select: [capability: string]; details: [capability: string] }>();

const uid = useId();
const viewport = ref<HTMLElement | null>(null);

const stageColors = computed(() =>
    Object.fromEntries(stages.map((stage, index) => [stage.id, stageColor(index)])),
);

const shown = computed(() => capabilities.filter(({ state }) => state !== "off"));
const layout = computed(() => graphLayout(shown.value));
const relation = computed(() => pathRelation(shown.value, selected));

const litEdge = ({ from, to }: { from: string; to: string }) =>
    relation.value[from] !== undefined && relation.value[to] !== undefined;

const { camera, easing, dragging, wasDragged, fit, zoomBy, wheel, press, move, release } =
    useGraphCamera(viewport, () =>
        layout.value.nodes.filter(({ id }) => relation.value[id] !== undefined),
    );

const click = (id: string) => {
    if (!wasDragged()) emit("select", id);
};

const details = (id: string) => {
    if (!wasDragged()) emit("details", id);
};

onMounted(() => fit(false));
watch(
    () => [selected, layout.value] as const,
    () => nextTick(() => fit(true)),
);
</script>
