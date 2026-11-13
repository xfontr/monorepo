<template>
    <div class="flex flex-col gap-4">
        <div ref="grid" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="widget in shown"
                :key="widget.id"
                :data-widget-id="widget.id"
                :class="[SPAN_CLASSES[widget.size], editing && 'widget-wiggle']"
                class="flex min-w-0 flex-col gap-2"
                @pointerdown="startPress"
                @pointermove="movePress"
                @pointerup="cancelPress"
                @pointercancel="cancelPress"
                @pointerleave="cancelPress"
                @contextmenu="swallowAfterPress"
            >
                <div
                    v-if="editing"
                    class="flex items-center gap-1 rounded-md bg-elevated px-1 py-0.5 text-xs"
                >
                    <UButton
                        data-widget-handle
                        class="cursor-grab active:cursor-grabbing"
                        icon="i-lucide-grip-vertical"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        :aria-label="`Drag ${labelFor(widget.id)}`"
                    />
                    <span class="mr-auto truncate font-medium">{{ labelFor(widget.id) }}</span>
                    <UButton
                        icon="i-lucide-arrow-left"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        :aria-label="`Move ${labelFor(widget.id)} earlier`"
                        @click="apply(moveWidget(layout, widget.id, -1))"
                    />
                    <UButton
                        icon="i-lucide-arrow-right"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        :aria-label="`Move ${labelFor(widget.id)} later`"
                        @click="apply(moveWidget(layout, widget.id, 1))"
                    />
                    <UButton
                        :icon="SIZE_ICONS[widget.size]"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        :aria-label="`Resize ${labelFor(widget.id)}, now ${widget.size}`"
                        @click="apply(cycleSize(layout, widget.id))"
                    />
                    <UButton
                        icon="i-lucide-x"
                        size="xs"
                        variant="ghost"
                        color="error"
                        :aria-label="`Remove ${labelFor(widget.id)}`"
                        @click="apply(removeWidget(layout, widget.id))"
                    />
                </div>

                <div
                    :inert="editing"
                    class="@container flex-1"
                    :class="editing && 'pointer-events-none'"
                >
                    <slot :name="widget.id" />
                </div>
            </div>
        </div>

        <div
            v-if="editing"
            class="sticky bottom-4 z-10 flex flex-wrap items-center justify-center gap-2 self-center rounded-full border border-default bg-default/90 px-3 py-2 shadow-lg backdrop-blur-sm"
        >
            <span class="hidden px-1 text-xs text-muted sm:inline">
                Drag, resize or remove widgets
            </span>
            <UDropdownMenu :items="addItems" :disabled="addItems.length === 0">
                <UButton
                    label="Add widget"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="soft"
                    :disabled="addItems.length === 0"
                />
            </UDropdownMenu>
            <UButton
                label="Reset"
                icon="i-lucide-rotate-ccw"
                size="sm"
                variant="ghost"
                color="neutral"
                @click="reset"
            />
            <UButton label="Done" icon="i-lucide-check" size="sm" @click="editing = false" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDraggable } from "vue-draggable-plus";
import type { DropdownMenuItem } from "@nuxt/ui";
import {
    addWidget,
    cycleSize,
    defaultLayout,
    moveWidget,
    removeWidget,
    resolveLayout,
    type DashboardLayout,
    type WidgetDefinition,
    type WidgetPlacement,
    type WidgetSize,
} from "../utils/dashboardLayout.ts";

interface Props {
    widgets: WidgetDefinition[];
    /** The `localStorage` key, one per dashboard. */
    storageKey: string;
    /** Widgets with nothing to show right now: skipped outside edit mode, kept in the layout. */
    empty?: string[];
}

const { widgets, storageKey, empty = [] } = defineProps<Props>();

const editing = defineModel<boolean>("editing", { default: false });

const SPAN_CLASSES = {
    small: "col-span-1",
    medium: "sm:col-span-2",
    wide: "sm:col-span-2 lg:col-span-4",
} as const satisfies Record<WidgetSize, string>;

const SIZE_ICONS = {
    small: "i-lucide-square",
    medium: "i-lucide-rectangle-horizontal",
    wide: "i-lucide-gallery-horizontal",
} as const satisfies Record<WidgetSize, string>;

const initialLayout = () => defaultLayout(widgets);
const layout = ref<DashboardLayout>(initialLayout());
const placements = computed<WidgetPlacement[]>({
    get: () => layout.value.widgets,
    set: (next) => (layout.value = { ...layout.value, widgets: next }),
});

const shown = computed(() =>
    editing.value
        ? layout.value.widgets
        : layout.value.widgets.filter((widget) => !empty.includes(widget.id)),
);

const byId = computed(() => new Map(widgets.map((widget) => [widget.id, widget])));
const labelFor = (id: string) => byId.value.get(id)?.label ?? id;

const apply = (next: DashboardLayout) => (layout.value = next);

/** The added widget lands first, which the floating bar may have scrolled out of view. */
const add = async (definition: WidgetDefinition) => {
    apply(addWidget(layout.value, definition));
    await nextTick();
    document
        .querySelector(`[data-widget-id="${definition.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

const LONG_PRESS_MS = 500;
/** Further than this and the pointer is scrolling or dragging, not pressing. */
const PRESS_SLOP_PX = 8;

let press: { timer: ReturnType<typeof setTimeout>; x: number; y: number } | null = null;
let pressed = false;

const cancelPress = () => {
    if (press) clearTimeout(press.timer);
    press = null;
};

// The press that opened edit mode ends in a click, which would otherwise follow the widget's link.
const swallowAfterPress = (event: Event) => {
    if (!pressed) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.type === "click") pressed = false;
};

const startPress = (event: PointerEvent) => {
    if (editing.value || event.button !== 0) return;

    cancelPress();
    pressed = false;
    const widget = event.currentTarget as HTMLElement;
    press = {
        x: event.clientX,
        y: event.clientY,
        timer: setTimeout(() => {
            pressed = true;
            press = null;
            widget.addEventListener("click", swallowAfterPress, { capture: true, once: true });
            editing.value = true;
        }, LONG_PRESS_MS),
    };
};

const movePress = (event: PointerEvent) => {
    if (!press) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > PRESS_SLOP_PX) cancelPress();
};

onBeforeUnmount(cancelPress);
const reset = () => (layout.value = initialLayout());

const addItems = computed<DropdownMenuItem[]>(() =>
    layout.value.hidden.flatMap((id) => {
        const definition = byId.value.get(id);

        return definition
            ? [
                  {
                      label: definition.label,
                      icon: definition.icon,
                      onSelect: () => add(definition),
                  },
              ]
            : [];
    }),
);

const grid = useTemplateRef<HTMLElement>("grid");

// Sortable only starts a drag from the handle, which exists only while editing.
useDraggable(grid, placements, { animation: 200, handle: "[data-widget-handle]" });

// The server has no saved layout, so the browser's copy is applied only once hydration is done.
onMounted(() => {
    try {
        const saved = localStorage.getItem(storageKey);

        layout.value = resolveLayout(saved ? JSON.parse(saved) : null, widgets);
    } catch {
        layout.value = initialLayout();
    }

    watch(
        layout,
        (next) => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // A private window or full storage keeps the layout for this visit only.
            }
        },
        { deep: true },
    );
});
</script>
