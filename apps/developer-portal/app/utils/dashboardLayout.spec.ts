import { describe, expect, it } from "vitest";
import {
    addWidget,
    cycleSize,
    defaultLayout,
    moveWidget,
    removeWidget,
    resolveLayout,
    type WidgetDefinition,
} from "./dashboardLayout.ts";

const DEFINITIONS: WidgetDefinition[] = [
    { id: "welcome", label: "Welcome", size: "wide" },
    { id: "coverage", label: "Coverage", size: "small" },
    { id: "issues", label: "Issues", size: "medium" },
    { id: "projects", label: "Projects", size: "small", hidden: true },
];

const ids = (layout: { widgets: { id: string }[] }) => layout.widgets.map((widget) => widget.id);

describe("resolveLayout", () => {
    it.each([
        ["nothing saved", null],
        ["a string", "garbage"],
        ["an unknown version", { version: 2, widgets: [], hidden: [] }],
    ])("falls back to the default layout for %s", (_, saved) => {
        expect(resolveLayout(saved, DEFINITIONS)).toEqual(defaultLayout(DEFINITIONS));
    });

    it("keeps the saved order and sizes, so a rearranged dashboard survives a reload", () => {
        const layout = resolveLayout(
            {
                version: 1,
                widgets: [
                    { id: "issues", size: "wide" },
                    { id: "welcome", size: "small" },
                    { id: "coverage", size: "small" },
                ],
                hidden: ["projects"],
            },
            DEFINITIONS,
        );

        expect(layout.widgets).toEqual([
            { id: "issues", size: "wide" },
            { id: "welcome", size: "small" },
            { id: "coverage", size: "small" },
        ]);
        expect(layout.hidden).toEqual(["projects"]);
    });

    it("drops a widget the code no longer has instead of rendering an empty cell", () => {
        const layout = resolveLayout(
            { version: 1, widgets: [{ id: "retired", size: "small" }], hidden: ["gone"] },
            DEFINITIONS,
        );

        expect(ids(layout)).not.toContain("retired");
        expect(layout.hidden).not.toContain("gone");
    });

    it("appends a widget the saved layout never saw, so new widgets reach existing dashboards", () => {
        const layout = resolveLayout(
            { version: 1, widgets: [{ id: "coverage", size: "small" }], hidden: [] },
            DEFINITIONS,
        );

        expect(ids(layout)).toEqual(["coverage", "welcome", "issues"]);
        expect(layout.hidden).toEqual(["projects"]);
    });

    it("keeps a removed widget removed rather than appending it back", () => {
        const layout = resolveLayout(
            { version: 1, widgets: [{ id: "coverage", size: "small" }], hidden: ["welcome"] },
            DEFINITIONS,
        );

        expect(ids(layout)).not.toContain("welcome");
        expect(layout.hidden).toContain("welcome");
    });

    it("repairs a bad size and a duplicate id rather than discarding the whole layout", () => {
        const layout = resolveLayout(
            {
                version: 1,
                widgets: [
                    { id: "issues", size: "huge" },
                    { id: "issues", size: "small" },
                ],
                hidden: [],
            },
            DEFINITIONS,
        );

        expect(layout.widgets[0]).toEqual({ id: "issues", size: "medium" });
        expect(ids(layout).filter((id) => id === "issues")).toHaveLength(1);
    });
});

describe("layout edits", () => {
    const layout = defaultLayout(DEFINITIONS);

    it("moves a removed widget into the Add widget list and back to the top", () => {
        const removed = removeWidget(layout, "welcome");

        expect(ids(removed)).toEqual(["coverage", "issues"]);
        expect(removed.hidden).toContain("welcome");

        const restored = addWidget(removed, DEFINITIONS[0]!);

        expect(ids(restored)).toEqual(["welcome", "coverage", "issues"]);
        expect(restored.hidden).not.toContain("welcome");
    });

    it("swaps neighbours and ignores a move off either end", () => {
        expect(ids(moveWidget(layout, "coverage", -1))).toEqual(["coverage", "welcome", "issues"]);
        expect(moveWidget(layout, "welcome", -1)).toBe(layout);
        expect(moveWidget(layout, "issues", 1)).toBe(layout);
    });

    it("cycles the size through every step and back to the first", () => {
        const once = cycleSize(layout, "coverage");
        const twice = cycleSize(once, "coverage");
        const thrice = cycleSize(twice, "coverage");

        expect([once, twice, thrice].map((next) => next.widgets[1]!.size)).toEqual([
            "medium",
            "wide",
            "small",
        ]);
    });
});
