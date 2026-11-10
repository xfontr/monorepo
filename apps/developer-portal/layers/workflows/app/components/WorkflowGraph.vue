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
import { Graph, layout as runLayout, type EdgeLabel, type NodeLabel } from "@dagrejs/dagre";
import type { CapabilityView, StageView } from "#layers/workflows/shared/workflows.ts";

interface Props {
    /** Every block in the project; switched-off ones are left out of the map. */
    capabilities: CapabilityView[];
    stages: StageView[];
    selected?: string | null;
}

const { capabilities, stages, selected = null } = defineProps<Props>();
const emit = defineEmits<{ select: [capability: string]; details: [capability: string] }>();

const NODE_WIDTH = 208;
const NODE_HEIGHT = 54;
const PADDING = 48;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.25;
/** A press that moves further than this is a drag, and doesn't select what it started on. */
const DRAG_THRESHOLD = 4;

const uid = useId();
const viewport = ref<HTMLElement | null>(null);

const stageColors = computed(() =>
    Object.fromEntries(stages.map((stage, index) => [stage.id, stageColor(index)])),
);

const shown = computed(() => capabilities.filter(({ state }) => state !== "off"));

/** Through the midpoints, so a link bends round the blocks dagre routed it past. */
const smooth = (points: { x: number; y: number }[]): string => {
    const [first, ...rest] = points;
    const last = rest.at(-1);
    if (!first || !last) return "";

    let path = `M${first.x},${first.y}`;
    for (let index = 0; index < rest.length - 1; index++) {
        const point = rest[index]!;
        const next = rest[index + 1]!;
        path += ` Q${point.x},${point.y} ${(point.x + next.x) / 2},${(point.y + next.y) / 2}`;
    }

    return `${path} L${last.x},${last.y}`;
};

const layout = computed(() => {
    const graph = new Graph<object, NodeLabel, EdgeLabel>();
    graph.setGraph({ rankdir: "LR", nodesep: 16, ranksep: 64, marginx: PADDING, marginy: PADDING });
    graph.setDefaultEdgeLabel(() => ({}));

    const ids = new Set(shown.value.map(({ id }) => id));
    for (const { id } of shown.value) graph.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });

    const links = shown.value.flatMap((capability) =>
        capability.needs
            .filter((need) => ids.has(need))
            .map((need) => [need, capability.id] as const),
    );
    for (const [from, to] of links) graph.setEdge(from, to);

    runLayout(graph);

    const label = graph.graph() as { width?: number; height?: number };

    return {
        width: label.width ?? 0,
        height: label.height ?? 0,
        nodes: shown.value.map((capability) => {
            const node = graph.node(capability.id);
            return {
                id: capability.id,
                capability,
                icon: blockKindIcon(capability.kind),
                x: (node.x ?? 0) - NODE_WIDTH / 2,
                y: (node.y ?? 0) - NODE_HEIGHT / 2,
            };
        }),
        edges: links.map(([from, to]) => ({
            key: `${from}>${to}`,
            from,
            to,
            path: smooth(graph.edge(from, to).points ?? []),
        })),
    };
});

/** Whether a block sits on the selected block's path, and how; everything else is greyed out. */
const relation = computed<Record<string, string>>(() => {
    if (!selected) return Object.fromEntries(shown.value.map(({ id }) => [id, ""]));

    const byId = new Map(shown.value.map((capability) => [capability.id, capability]));
    const walk = (from: string, next: (capability: CapabilityView) => string[]) => {
        const seen = new Set<string>();
        const queue = [from];

        for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
            for (const other of next(byId.get(id)!) ?? []) {
                if (!seen.has(other) && byId.has(other)) {
                    seen.add(other);
                    queue.push(other);
                }
            }
        }

        return seen;
    };

    if (!byId.has(selected)) return {};

    return {
        ...Object.fromEntries([...walk(selected, (c) => c.needs)].map((id) => [id, "needed"])),
        ...Object.fromEntries(
            [...walk(selected, (c) => c.unblocks)].map((id) => [id, "waits on it"]),
        ),
        [selected]: "",
    };
});

const litEdge = ({ from, to }: { from: string; to: string }) =>
    relation.value[from] !== undefined && relation.value[to] !== undefined;

// ── The camera ────────────────────────────────────────────────────────────────────────────────────

const camera = reactive({ x: 0, y: 0, k: 1 });
const easing = ref(false);
let easeTimer: ReturnType<typeof setTimeout> | undefined;

const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

const ease = (animate: boolean) => {
    easing.value = animate;
    clearTimeout(easeTimer);
    if (animate) easeTimer = setTimeout(() => (easing.value = false), 500);
};

/** Frames exactly the lit blocks: the selected path, or the whole map with nothing selected. */
const fit = (animate: boolean) => {
    const box = viewport.value?.getBoundingClientRect();
    const lit = layout.value.nodes.filter(({ id }) => relation.value[id] !== undefined);
    if (!box?.width || lit.length === 0) return;

    const left = Math.min(...lit.map(({ x }) => x));
    const top = Math.min(...lit.map(({ y }) => y));
    const right = Math.max(...lit.map(({ x }) => x + NODE_WIDTH));
    const bottom = Math.max(...lit.map(({ y }) => y + NODE_HEIGHT));
    const k = clampZoom(
        Math.min(
            (box.width - PADDING * 2) / (right - left),
            (box.height - PADDING * 2) / (bottom - top),
        ),
    );

    ease(animate);
    camera.k = k;
    camera.x = box.width / 2 - ((left + right) / 2) * k;
    camera.y = box.height / 2 - ((top + bottom) / 2) * k;
};

/** Zooms keeping the map point under `(px, py)` in place; the viewport's centre by default. */
const zoomBy = (factor: number, px?: number, py?: number) => {
    const box = viewport.value?.getBoundingClientRect();
    if (!box) return;

    const cx = px ?? box.width / 2;
    const cy = py ?? box.height / 2;
    const k = clampZoom(camera.k * factor);

    ease(px === undefined);
    camera.x = cx - ((cx - camera.x) / camera.k) * k;
    camera.y = cy - ((cy - camera.y) / camera.k) * k;
    camera.k = k;
};

/** Pinch on a trackpad arrives as a ctrl-wheel; a plain wheel keeps scrolling the page. */
const wheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    const box = viewport.value!.getBoundingClientRect();
    zoomBy(Math.exp(-event.deltaY * 0.01), event.clientX - box.left, event.clientY - box.top);
};

const dragging = ref(false);
let pressed: { x: number; y: number; cameraX: number; cameraY: number; id: number } | null = null;
let dragged = false;

const press = (event: PointerEvent) => {
    if (event.button !== 0) return;
    pressed = {
        x: event.clientX,
        y: event.clientY,
        cameraX: camera.x,
        cameraY: camera.y,
        id: event.pointerId,
    };
    dragged = false;
};

const move = (event: PointerEvent) => {
    if (!pressed || event.pointerId !== pressed.id) return;

    const dx = event.clientX - pressed.x;
    const dy = event.clientY - pressed.y;

    // Capturing only once it is a drag, so a plain click still lands on the block under it.
    if (!dragged && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragged = true;
        dragging.value = true;
        ease(false);
        viewport.value?.setPointerCapture(event.pointerId);
    }

    if (dragged) {
        camera.x = pressed.cameraX + dx;
        camera.y = pressed.cameraY + dy;
    }
};

const release = (event: PointerEvent) => {
    if (pressed && viewport.value?.hasPointerCapture(event.pointerId)) {
        viewport.value.releasePointerCapture(event.pointerId);
    }
    pressed = null;
    dragging.value = false;
};

const click = (id: string) => {
    if (!dragged) emit("select", id);
};

const details = (id: string) => {
    if (!dragged) emit("details", id);
};

onMounted(() => fit(false));
watch(
    () => [selected, layout.value] as const,
    () => nextTick(() => fit(true)),
);
onBeforeUnmount(() => clearTimeout(easeTimer));
</script>
