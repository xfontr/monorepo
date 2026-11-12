export type WidgetSize = "small" | "medium" | "wide";

export const WIDGET_SIZES: readonly WidgetSize[] = ["small", "medium", "wide"];

export interface WidgetDefinition {
    id: string;
    label: string;
    icon?: string;
    size: WidgetSize;
    /** Starts in the Add widget list rather than on the dashboard. */
    hidden?: boolean;
}

export interface WidgetPlacement {
    id: string;
    size: WidgetSize;
}

export interface DashboardLayout {
    version: 1;
    widgets: WidgetPlacement[];
    hidden: string[];
}

export const defaultLayout = (definitions: readonly WidgetDefinition[]): DashboardLayout => ({
    version: 1,
    widgets: definitions.filter((widget) => !widget.hidden).map(({ id, size }) => ({ id, size })),
    hidden: definitions.filter((widget) => widget.hidden).map((widget) => widget.id),
});

const isSize = (value: unknown): value is WidgetSize => WIDGET_SIZES.includes(value as WidgetSize);

/**
 * Reads whatever the browser had saved against the widgets that exist now: unknown ids are
 * dropped, and a widget the saved layout never saw takes its default place.
 */
export const resolveLayout = (
    saved: unknown,
    definitions: readonly WidgetDefinition[],
): DashboardLayout => {
    const fallback = defaultLayout(definitions);

    if (typeof saved !== "object" || saved === null || !("version" in saved)) return fallback;
    if (saved.version !== 1) return fallback;

    const byId = new Map(definitions.map((widget) => [widget.id, widget]));
    const seen = new Set<string>();
    const widgets: WidgetPlacement[] = [];
    const hidden: string[] = [];

    const savedWidgets: unknown[] =
        "widgets" in saved && Array.isArray(saved.widgets) ? saved.widgets : [];
    const savedHidden: unknown[] =
        "hidden" in saved && Array.isArray(saved.hidden) ? saved.hidden : [];

    for (const entry of savedWidgets) {
        if (typeof entry !== "object" || entry === null) continue;

        const id = "id" in entry ? entry.id : undefined;
        const size = "size" in entry ? entry.size : undefined;
        const definition = typeof id === "string" ? byId.get(id) : undefined;

        if (!definition || seen.has(definition.id)) continue;

        seen.add(definition.id);
        widgets.push({ id: definition.id, size: isSize(size) ? size : definition.size });
    }

    for (const id of savedHidden) {
        if (typeof id !== "string" || !byId.has(id) || seen.has(id)) continue;

        seen.add(id);
        hidden.push(id);
    }

    for (const definition of definitions) {
        if (seen.has(definition.id)) continue;

        if (definition.hidden) hidden.push(definition.id);
        else widgets.push({ id: definition.id, size: definition.size });
    }

    return { version: 1, widgets, hidden };
};

export const removeWidget = (layout: DashboardLayout, id: string): DashboardLayout => ({
    ...layout,
    widgets: layout.widgets.filter((widget) => widget.id !== id),
    hidden: layout.hidden.includes(id) ? layout.hidden : [...layout.hidden, id],
});

/** Puts the widget first, where whoever just added it is already looking. */
export const addWidget = (
    layout: DashboardLayout,
    definition: WidgetDefinition,
): DashboardLayout => ({
    ...layout,
    widgets: [
        { id: definition.id, size: definition.size },
        ...layout.widgets.filter((widget) => widget.id !== definition.id),
    ],
    hidden: layout.hidden.filter((id) => id !== definition.id),
});

/** Swaps a widget with its neighbour, the keyboard's stand-in for dragging. */
export const moveWidget = (
    layout: DashboardLayout,
    id: string,
    direction: -1 | 1,
): DashboardLayout => {
    const from = layout.widgets.findIndex((widget) => widget.id === id);
    const to = from + direction;

    if (from === -1 || to < 0 || to >= layout.widgets.length) return layout;

    const widgets = [...layout.widgets];
    [widgets[from], widgets[to]] = [widgets[to]!, widgets[from]!];

    return { ...layout, widgets };
};

export const cycleSize = (layout: DashboardLayout, id: string): DashboardLayout => ({
    ...layout,
    widgets: layout.widgets.map((widget) =>
        widget.id === id
            ? {
                  ...widget,
                  size: WIDGET_SIZES[
                      (WIDGET_SIZES.indexOf(widget.size) + 1) % WIDGET_SIZES.length
                  ]!,
              }
            : widget,
    ),
});
